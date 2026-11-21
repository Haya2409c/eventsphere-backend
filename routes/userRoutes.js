const express = require('express');
const router = express.Router();
const { updateProfile, getAllUsers, updateUserStatus } = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.put('/profile', protect, updateProfile);
router.get('/', protect, authorizeRoles('admin'), getAllUsers);
router.patch('/:id/status', protect, authorizeRoles('admin'), updateUserStatus);

module.exports = router;