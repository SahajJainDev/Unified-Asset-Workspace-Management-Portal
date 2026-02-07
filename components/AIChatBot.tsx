
import React, { useState, useRef, useEffect } from 'react';
import apiService from '../services/apiService';

interface Message {
  role: 'user' | 'model';
  content: string;
  intent?: any;
  actionStatus?: 'pending' | 'confirmed' | 'cancelled';
}

interface Session {
  _id: string;
  title: string;
  lastActivity: string;
}

const AIChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Load sessions when chat is opened
  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const fetchSessions = async () => {
    try {
      const data = await apiService.getChatSessions();
      setSessions(data as Session[]);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const loadSession = async (sessionId: string) => {
    try {
      setInitializing(true);
      const session = await apiService.getChatSessionHistory(sessionId);
      setMessages(session.messages);
      setCurrentSessionId(sessionId);
      setShowHistory(false);
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setInitializing(false);
    }
  };

  const startNewChat = async () => {
    try {
      setInitializing(true);
      const newSession = await apiService.createNewChatSession();
      setCurrentSessionId(newSession._id);
      setMessages([]);
      setSessions(prev => [newSession, ...prev]);
      setShowHistory(false);
    } catch (error) {
      // Fallback: clear current state and start fresh locally until first message
      setCurrentSessionId(null);
      setMessages([]);
      setShowHistory(false);
    } finally {
      setInitializing(false);
    }
  };

  const deleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await apiService.deleteChatSession(sessionId);
      setSessions(prev => prev.filter(s => s._id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
    } catch (error) {
      alert('Failed to delete session');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');

    // Optimistic update
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await apiService.sendChatMessage(userMessage, currentSessionId || undefined);

      const botMsg: Message = {
        role: 'model',
        content: response.response,
        intent: response.intent,
        actionStatus: response.intent ? 'pending' : undefined
      };

      setMessages(prev => [...prev, botMsg]);

      if (!currentSessionId) {
        setCurrentSessionId(response.sessionId);
        fetchSessions(); // Refresh list to get the new title
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'model', content: error.message || "Error connecting to AI assistant. Please check your network." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionConfirm = async (index: number, intent: any) => {
    try {
      setLoading(true);
      const result = await apiService.executeAction(intent);

      setMessages(prev => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          actionStatus: 'confirmed',
          content: `${next[index].content}\n\n**System Update:** ${result.message}`
        };
        return next;
      });
    } catch (error: any) {
      alert(error.message || 'Failed to execute action');
    } finally {
      setLoading(false);
    }
  };

  const handleActionCancel = (index: number) => {
    setMessages(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        actionStatus: 'cancelled',
        content: `${next[index].content}\n\n*Action cancelled by user.*`
      };
      return next;
    });
  };

  const renderMessageContent = (content: string) => {
    // Simple formatting: newlines and basic bold
    return content.split('\n').map((line, i) => (
      <span key={i}>
        {line.split('**').map((part, j) => (
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
        ))}
        {i < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 size-14 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[100] group"
      >
        <span className="material-symbols-outlined text-3xl group-hover:rotate-12 transition-transform">smart_toy</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[101] flex items-end justify-end p-6 pointer-events-none">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-auto" onClick={() => setIsOpen(false)}></div>

          <div className="relative w-full max-w-lg h-[650px] max-h-[85vh] bg-white dark:bg-[#1a2632] rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 pointer-events-auto">

            {/* Header */}
            <div className="p-6 bg-primary text-white flex justify-between items-center shrink-0 z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="size-10 rounded-2xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  title="Chat History"
                >
                  <span className="material-symbols-outlined">{showHistory ? 'chat' : 'menu'}</span>
                </button>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-widest">
                    {showHistory ? 'Conversation History' : 'AssetTrack AI'}
                  </h3>
                  <p className="text-[10px] font-bold text-white/70">
                    {showHistory ? `${sessions.length} sessions stored` : (currentSessionId ? 'Ongoing Chat' : 'New Session')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={startNewChat} className="size-10 rounded-2xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors" title="Start New Chat">
                  <span className="material-symbols-outlined">add</span>
                </button>
                <button onClick={() => setIsOpen(false)} className="size-10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            <div className="flex-1 relative flex overflow-hidden">

              {/* Sidebar History */}
              <div className={`absolute inset-0 z-20 bg-white dark:bg-[#1a2632] transition-transform duration-300 transform ${showHistory ? 'translate-x-0' : '-translate-x-full'} border-r border-gray-100 dark:border-gray-800`}>
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                    <button
                      onClick={startNewChat}
                      className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800 text-slate-400 hover:border-primary hover:text-primary transition-all mb-4"
                    >
                      <span className="material-symbols-outlined">add_circle</span>
                      <span className="text-sm font-bold">New Conversation</span>
                    </button>

                    {sessions.map((s) => (
                      <div
                        key={s._id}
                        onClick={() => loadSession(s._id)}
                        className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${currentSessionId === s._id
                          ? 'bg-primary/5 border border-primary/20 text-primary'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent'
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="material-symbols-outlined text-slate-400">forum</span>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate pr-2">{s.title}</p>
                            <p className="text-[10px] text-slate-400">{new Date(s.lastActivity).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => deleteSession(e, s._id)}
                          className="size-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    ))}

                    {sessions.length === 0 && (
                      <div className="text-center py-10">
                        <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-slate-800 mb-4">history</span>
                        <p className="text-slate-400 text-sm">No previous conversations</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Chat Area */}
              <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-slate-900/20">
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar"
                >
                  {messages.length === 0 && !initializing && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in zoom-in duration-700">
                      <div className="size-20 rounded-[2.5rem] bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-5xl">smart_toy</span>
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-slate-800 dark:text-white mb-2">How can I help you today?</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                          I can help you track hardware, manage software licenses, or assign workstations to employees.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 w-full max-w-sm px-4">
                        {[
                          "Track a laptop",
                          "License status",
                          "Floor layouts",
                          "Warranty check"
                        ].map((suggest, i) => (
                          <button
                            key={i}
                            onClick={() => setInput(suggest)}
                            className="p-3 bg-white dark:bg-gray-800 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 border border-gray-100 dark:border-gray-700 hover:border-primary/40 hover:text-primary transition-all text-left"
                          >
                            {suggest}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {initializing ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="flex flex-col items-center gap-4">
                        <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Initializing...</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed ${m.role === 'user'
                          ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10'
                          : 'bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-300 rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-sm'
                          }`}>
                          <div className="whitespace-pre-wrap">
                            {renderMessageContent(m.content)}
                          </div>

                          {m.intent && m.actionStatus === 'pending' && (
                            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-3">
                              <div className="flex items-center gap-2 text-primary">
                                <span className="material-symbols-outlined text-xl">info</span>
                                <span className="text-xs font-black uppercase tracking-wider">Action Required</span>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Intent</p>
                                <p className="text-xs font-bold text-slate-800 dark:text-white capitalize">{m.intent.intent.replace(/([A-Z])/g, ' $1')}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                {m.intent.entities.asset && (
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Asset</p>
                                    <p className="text-xs font-bold truncate">{m.intent.entities.asset}</p>
                                  </div>
                                )}
                                {m.intent.entities.employee && (
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Employee</p>
                                    <p className="text-xs font-bold truncate">{m.intent.entities.employee}</p>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2 pt-2">
                                <button
                                  onClick={() => handleActionConfirm(i, m.intent)}
                                  className="flex-1 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => handleActionCancel(i)}
                                  className="flex-1 py-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          <div className={`text-[9px] mt-2 opacity-40 font-bold uppercase tracking-wider ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                            {m.role === 'user' ? 'You' : 'AssetTrack AI'}
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex gap-2">
                          <div className="size-2 bg-primary/20 rounded-full animate-bounce"></div>
                          <div className="size-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                          <div className="size-2 bg-primary/60 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-white dark:bg-[#1a2632] border-t border-gray-100 dark:border-gray-800 shrink-0">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Type your message..."
                      className="flex-1 bg-slate-100 dark:bg-slate-900 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                    <button
                      onClick={handleSend}
                      disabled={loading || !input.trim()}
                      className="size-14 bg-primary text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:grayscale transition-all"
                    >
                      <span className="material-symbols-outlined text-2xl">send</span>
                    </button>
                  </div>
                  <p className="text-[9px] text-center text-slate-400 mt-3 font-semibold uppercase tracking-widest">
                    AI-Powered Assistant • Powered by Google Gemini
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatBot;
