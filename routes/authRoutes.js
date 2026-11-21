
const express = require('express');
const router = express.Router();

// Import controller functions
const {
    registerUser,
    loginUser,
    getMe
} = require('../controllers/authController');

// Import authentication middleware
const { protect } = require('../middleware/authMiddleware');


// Register a new user
router.post('/register', registerUser);

// Login user
router.post('/login', loginUser);

// Get logged-in user details
router.get('/me', protect, getMe);


// Export routes
module.exports = router;
