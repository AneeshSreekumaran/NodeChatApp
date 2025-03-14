const express = require('express');
const chatController = require('../controllers/chatController');
const { isLoggedIn } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/uploads/'); // Set the destination folder
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

const upload = multer({ storage: storage });


// Create private chat
router.post('/private', isLoggedIn, chatController.createPrivateChat);

// Create group chat
router.post('/group', isLoggedIn, chatController.createGroupChat);

// Add user to group chat
router.post('/group/:chatId/add', isLoggedIn, chatController.addUserToGroup);

// Remove user from group chat
router.post('/group/:chatId/remove', isLoggedIn, chatController.removeUserFromGroup);

// Send message
router.post('/:chatId/message', isLoggedIn, chatController.sendMessage);

// Get chat messages
router.get('/:chatId/messages', isLoggedIn, chatController.getChatMessages);

// Get user chats
router.get('/chats', isLoggedIn, chatController.getUserChats);

module.exports = router;