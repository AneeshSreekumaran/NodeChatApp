const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User ' },
    content: { type: String },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Message', messageSchema);