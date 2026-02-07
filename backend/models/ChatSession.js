const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'model'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const ChatSessionSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    title: {
        type: String,
        default: 'New Conversation'
    },
    messages: [MessageSchema],
    tokenUsage: {
        type: Number,
        default: 0
    },
    lastActivity: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Update lastActivity on save
ChatSessionSchema.pre('save', function (next) {
    this.lastActivity = Date.now();
    next();
});

module.exports = mongoose.model('ChatSession', ChatSessionSchema);
