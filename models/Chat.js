const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  type: { type: String, enum: ['private', 'group'], required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String },
    timestamp: { type: Date, default: Date.now },
    file: { type: String } // Store file path for attachments
  }],
  groupName: { type: String, default: null } // For group chats
});

module.exports = mongoose.model('Chat', chatSchema);