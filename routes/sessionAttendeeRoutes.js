
const express = require('express');
const router = express.Router();

// Import session and attendee controller functions
const {
  createSession,
  getSessions,
  registerForExpo,
  bookmarkSession,
  getMyScheduleAndRecommendations,
} = require('../controllers/sessionAttendeeController');

// Import authentication and role-based authorization middleware
const {
  protect,
  authorizeRoles,
} = require('../middleware/authMiddleware');


// Session Routes

// Create a new session or workshop (Admin only)
router.post(
  '/sessions',
  protect,
  authorizeRoles('admin'),
  createSession
);

// Get all sessions with topic and title search
// Example: /api/sessions?topic=AI&search=Future
router.get(
  '/sessions',
  getSessions
);


// Attendee Portal Routes

// Register an attendee for an expo
router.post(
  '/attendee/register-expo/:expoId',
  protect,
  authorizeRoles('attendee'),
  registerForExpo
);

// Add a session to the attendee's personal schedule
router.post(
  '/attendee/bookmark-session/:sessionId',
  protect,
  authorizeRoles('attendee'),
  bookmarkSession
);

// Get personal schedule and recommended sessions
router.get(
  '/attendee/my-schedule',
  protect,
  authorizeRoles('attendee'),
  getMyScheduleAndRecommendations
);


// Export router
module.exports = router;
