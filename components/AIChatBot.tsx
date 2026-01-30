
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

const AIChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: 'Hello! I am your IT Asset Assistant. How can I help you today with hardware tracking or software compliance?' }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMessage,
        config: {
          systemInstruction: 'You are an expert IT Asset Manager. You help admins with tracking hardware (MacBooks, Dell, mobile devices), monitoring software licenses (utilization, renewals), and managing office floor plans. Be professional, concise, and helpful. Use the context that this app is called AssetTrack Pro.',
        },
      });

      const botResponse = response.text || "I'm sorry, I couldn't process that request right now.";
      setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: "Error connecting to AI assistant. Please check your network." }]);
    } finally {
      setLoading(false);
    }
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
          <div className="relative w-full max-w-md h-[600px] max-h-[80vh] bg-white dark:bg-[#1a2632] rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 pointer-events-auto">
            <div className="p-6 bg-primary text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined">smart_toy</span>
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-widest">AssetTrack AI</h3>
                  <p className="text-[10px] font-bold text-white/70">Online & Ready</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="size-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-50/50 dark:bg-slate-900/20"
            >
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10' 
                      : 'bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-300 rounded-tl-none border border-gray-100 dark:border-gray-700'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl rounded-tl-none border border-gray-100 dark:border-gray-700">
                    <div className="flex gap-1">
                      <div className="size-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                      <div className="size-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="size-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-800 shrink-0">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about your assets..."
                  className="flex-1 bg-slate-100 dark:bg-slate-900 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
                <button 
                  onClick={handleSend}
                  disabled={loading}
                  className="size-12 bg-primary text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatBot;
