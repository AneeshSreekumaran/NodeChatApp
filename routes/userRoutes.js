const express = require('express');
const userController = require('../controllers/userController');
const { isLoggedIn } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/profile-picture', isLoggedIn, userController.uploadProfilePicture);
router.post('/edit-username', isLoggedIn, userController.editUsername);
router.post('/edit-email', isLoggedIn, userController.editEmail);

module.exports = router;