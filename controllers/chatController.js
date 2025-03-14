const Chat = require('../models/Chat');
const User = require('../models/User');
const mongoose = require('mongoose')

// Create a new private chat
exports.createPrivateChat = async (req, res) => {
    try {
        const userId = req.session.userId;
        const recipientEmail = req.body.recipientEmail;

        // Find the recipient user by email
        const recipient = await User.findOne({ email: recipientEmail });
        if (!recipient) {
            return res.status(400).json({ message: 'Recipient not found' });
        }

        // Check if a chat already exists between these two users
        let existingChat = await Chat.findOne({
            type: 'private',
            participants: { $all: [userId, recipient._id] },
        });

        if (existingChat) {
            return res.status(200).json({ message: 'Chat already exists', chatId: existingChat._id });
        }

        // Create a new chat
        const newChat = new Chat({
            type: 'private',
            participants: [userId, recipient._id],
        });

        await newChat.save();

        res.status(201).json({ message: 'Private chat created', chatId: newChat._id });
    } catch (error) {
        console.error('Error creating private chat:', error);
        res.status(500).json({ message: 'Failed to create private chat' });
    }
};


// Create a new group chat
exports.createGroupChat = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { groupName, recipientEmails } = req.body;

        //Check if there are at least two other recipients
        if (!recipientEmails || recipientEmails.length < 2) {
            return res.status(400).json({ message: 'Group chat must have at least two other users.' });
        }

        // Find the recipient users by email
        const recipients = await User.find({ email: { $in: recipientEmails } });

        if (recipients.length !== recipientEmails.length) {
            return res.status(400).json({ message: 'One or more recipients not found.' });
        }

        //Include the creator to the participants array
        const participantIds = recipients.map(recipient => recipient._id);
        participantIds.push(userId);

        const newChat = new Chat({
            type: 'group',
            participants: participantIds,
            groupName: groupName,
        });

        await newChat.save();

        res.status(201).json({ message: 'Group chat created', chatId: newChat._id });
    } catch (error) {
        console.error('Error creating group chat:', error);
        res.status(500).json({ message: 'Failed to create group chat' });
    }
};

// Add user to group chat
exports.addUserToGroup = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { userEmail } = req.body;
        const userId = req.session.userId;

        const chat = await Chat.findById(chatId);
        if (!chat || chat.type !== 'group') {
            return res.status(404).json({ message: 'Group chat not found' });
        }

        //Only participants of the group can add
        if (!chat.participants.includes(userId)) {
            return res.status(403).json({ message: 'You are not authorized to add users to this group' });
        }

        const userToAdd = await User.findOne({ email: userEmail });
        if (!userToAdd) {
            return res.status(404).json({ message: 'User to add not found' });
        }

        if (chat.participants.includes(userToAdd._id)) {
            return res.status(400).json({ message: 'User is already in the group' });
        }

        chat.participants.push(userToAdd._id);
        await chat.save();

        res.status(200).json({ message: 'User added to group successfully' });
    } catch (error) {
        console.error('Error adding user to group:', error);
        res.status(500).json({ message: 'Failed to add user to group' });
    }
};


// Remove user from group chat
exports.removeUserFromGroup = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { userIdToRemove } = req.body; // Expecting the user ID to remove
        const userId = req.session.userId;

        const chat = await Chat.findById(chatId);

        if (!chat || chat.type !== 'group') {
            return res.status(404).json({ message: 'Group chat not found' });
        }

        // Check if the user removing is a participant and if it is the same to be removed
        if (!chat.participants.includes(userId) || userId == userIdToRemove) {
            return res.status(403).json({ message: 'You are not authorized to remove users from this group' });
        }

        // Check if the user to remove is in the group
        if (!chat.participants.includes(mongoose.Types.ObjectId(userIdToRemove))) {
            return res.status(404).json({ message: 'User to remove not found in group' });
        }

        // Remove the user from the participants array
        chat.participants = chat.participants.filter(participant => participant.toString() !== userIdToRemove);
        await chat.save();

        res.status(200).json({ message: 'User removed from group successfully' });
    } catch (error) {
        console.error('Error removing user from group:', error);
        res.status(500).json({ message: 'Failed to remove user from group' });
    }
};


// Send message
exports.sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content } = req.body;
        const senderId = req.session.userId;
        const chat = await Chat.findById(chatId).populate('messages').exec(); // Populate messages field
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        // Check if the sender is a participant in the chat
        if (!chat.participants.includes(senderId)) {
            return res.status(403).json({ message: 'You are not a participant in this chat' });
        }

        const newMessage = {
            sender: senderId,
            content: content,
        };

        chat.messages.push(newMessage);
        await chat.save();


        // Emit the message to all participants in the chat via Socket.IO
        req.app.io.to(chatId).emit('newMessage', { chatId, message: newMessage });

        res.status(201).json({ message: 'Message sent', newMessage });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Failed to send message' });
    }
};


// Get all chats from the user with pagination
exports.getUserChats = async (req, res) => {
    try {
        const userId = req.session.userId;
        const page = parseInt(req.query.page) || 1;  // Default to page 1 if not provided
        const limit = parseInt(req.query.limit) || 10;  // Default to 10 chats per page if not provided
        const skip = (page - 1) * limit;  // Skip chats for pagination

        // Find all chats where the user is a participant
        const chats = await Chat.find({ participants: userId })
            .populate('participants', 'username profilePicture') // Populate participant info
            .sort({ 'messages.timestamp': -1 })  // Sort by last message timestamp (descending)
            .skip(skip)  // Skip chats based on pagination
            .limit(limit);  // Limit the number of chats returned

        // Count the total number of chats for pagination
        const totalChats = await Chat.countDocuments({ participants: userId });

        res.status(200).json({
            chats,
            totalChats,
            currentPage: page,
            totalPages: Math.ceil(totalChats / limit)
        });
    } catch (error) {
        console.error('Error getting user chats:', error);
        res.status(500).json({ message: 'Failed to get user chats' });
    }
};
