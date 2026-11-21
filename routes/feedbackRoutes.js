
const express = require('express');
const router = express.Router();

// Import feedback controller functions
const {
  submitFeedback,
  getAllFeedbacks,
  replyFeedback,
} = require('../controllers/feedbackController');

// Import authentication and role-based authorization middleware
const {
  protect,
  authorizeRoles,
} = require('../middleware/authMiddleware');


// Feedback Routes

// Submit feedback for an expo (Logged-in users)
router.post(
  '/',
  protect,
  submitFeedback
);

// Get all user feedbacks (Admin only)
router.get(
  '/',
  protect,
  authorizeRoles('admin'),
  getAllFeedbacks
);

// Reply to user feedback (Admin only)
router.patch(
  '/:id/reply',
  protect,
  authorizeRoles('admin'),
  replyFeedback
);


// Export router
module.exports = router;
