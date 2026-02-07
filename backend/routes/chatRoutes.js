const express = require('express');
const router = express.Router();
const ChatSession = require('../models/ChatSession');
const geminiService = require('../services/geminiService');

/**
 * POST /api/chat/send
 * Sends a message to the AI and gets a response.
 */
router.post('/send', async (req, res) => {
    try {
        const { message, sessionId, userId = 'admin' } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        let session;

        if (sessionId) {
            session = await ChatSession.findById(sessionId);
            if (!session) {
                return res.status(404).json({ message: 'Session not found' });
            }
        } else {
            // Create new session if no sessionId provided
            const title = await geminiService.generateTitle(message);
            session = new ChatSession({
                userId,
                title,
                messages: []
            });
        }

        // Format history for Gemini
        const history = session.messages.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));

        // Generate response using intent interpretation
        const intentResult = await geminiService.interpretIntent(message, history);

        // Update session
        session.messages.push({ role: 'user', content: message });
        session.messages.push({ role: 'model', content: intentResult.message });
        await session.save();

        res.json({
            sessionId: session._id,
            title: session.title,
            response: intentResult.message,
            intent: intentResult.type === 'action' ? intentResult : null,
            history: session.messages
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
});

/**
 * GET /api/chat/sessions
 * List all chat sessions for a user.
 */
router.get('/sessions', async (req, res) => {
    try {
        const { userId = 'admin' } = req.query;
        const sessions = await ChatSession.find({ userId })
            .select('title lastActivity createdAt')
            .sort({ lastActivity: -1 });
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch sessions' });
    }
});

/**
 * GET /api/chat/sessions/:sessionId
 * Get history for a specific session.
 */
router.get('/sessions/:sessionId', async (req, res) => {
    try {
        const session = await ChatSession.findById(req.params.sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }
        res.json(session);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch session history' });
    }
});

/**
 * DELETE /api/chat/sessions/:sessionId
 * Delete a session.
 */
router.delete('/sessions/:sessionId', async (req, res) => {
    try {
        await ChatSession.findByIdAndDelete(req.params.sessionId);
        res.json({ message: 'Session deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete session' });
    }
});

/**
 * POST /api/chat/new-session
 * Manually create a new session.
 */
router.post('/new-session', async (req, res) => {
    try {
        const { userId = 'admin' } = req.body;
        const session = new ChatSession({
            userId,
            title: 'New Conversation',
            messages: []
        });
        await session.save();
        res.status(201).json(session);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create new session' });
    }
});

module.exports = router;
