
const express = require('express');
const router = express.Router();

// Import expo and booth controller functions
const {
  createExpo,
  getAllExpos,
  getExpoById,
  updateExpo,
  deleteExpo,
  createBooth,
  getBoothsByExpo,
  requestBooth,
  approveBooth,
  updateBooth,
  deleteBooth,
  updateBoothDetails,
  getMyBooths,
  addBoothView,
  searchExhibitors,
} = require('../controllers/expoBoothController');

// Import authentication and role-based authorization middleware
const {
  protect,
  authorizeRoles,
} = require('../middleware/authMiddleware');


// Expo Routes

// Create a new expo (Admin only)
router.post(
  '/expos',
  protect,
  authorizeRoles('admin'),
  createExpo
);

// Get all expos with search and theme filters
// Example: /api/expos?search=Tech&theme=AI
router.get('/expos', getAllExpos);

// Get one expo
router.get('/expos/:id', getExpoById);

// Update an expo (Admin only)
router.put('/expos/:id', protect, authorizeRoles('admin'), updateExpo);

// Delete an expo with its booths and sessions (Admin only)
router.delete('/expos/:id', protect, authorizeRoles('admin'), deleteExpo);


// Booth Routes

// Create a new booth (Admin only)
router.post(
  '/booths',
  protect,
  authorizeRoles('admin'),
  createBooth
);

// Booths of the logged-in exhibitor. Must come before '/booths/:id' routes.
router.get('/booths/mine', protect, authorizeRoles('exhibitor'), getMyBooths);

// Edit a booth or assign an exhibitor (Admin only)
router.put('/booths/:id', protect, authorizeRoles('admin'), updateBooth);

// Delete a booth (Admin only)
router.delete('/booths/:id', protect, authorizeRoles('admin'), deleteBooth);

// Owner exhibitor edits products + staff
router.put('/booths/:id/details', protect, authorizeRoles('exhibitor'), updateBoothDetails);

// +1 view when an attendee opens the booth (public)
router.post('/booths/:id/view', addBoothView);

// Get all booths for a specific expo
router.get(
  '/booths/expo/:expoId',
  getBoothsByExpo
);

// Submit a booth booking request (Exhibitor only)
router.put(
  '/booths/:boothId/request',
  protect,
  authorizeRoles('exhibitor'),
  requestBooth
);

// Approve or reject a booth request (Admin only)
router.patch(
  '/booths/:boothId/approve',
  protect,
  authorizeRoles('admin'),
  approveBooth
);


// Exhibitor Routes

// Search approved exhibitors by company name or category
// Example: /api/exhibitors/search?keyword=AI
router.get(
  '/exhibitors/search',
  searchExhibitors
);


// Export router
module.exports = router;
