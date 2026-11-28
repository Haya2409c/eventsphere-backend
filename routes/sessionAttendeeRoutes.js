
const express = require('express');
const router = express.Router();

// Import session and attendee controller functions
const {
  createSession,
  updateSession,
  deleteSession,
  getSessions,
  registerForExpo,
  bookmarkSession,
  unbookmarkSession,
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

// Update a session (Admin only)
router.put('/sessions/:id', protect, authorizeRoles('admin'), updateSession);

// Delete a session (Admin only)
router.delete('/sessions/:id', protect, authorizeRoles('admin'), deleteSession);

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

// Remove a session from the attendee's personal schedule
router.delete(
  '/attendee/bookmark-session/:sessionId',
  protect,
  authorizeRoles('attendee'),
  unbookmarkSession
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
