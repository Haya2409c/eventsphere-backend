
const express = require('express');
const router = express.Router();

// Import expo and booth controller functions
const {
  createExpo,
  getAllExpos,
  createBooth,
  getBoothsByExpo,
  requestBooth,
  approveBooth,
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


// Booth Routes

// Create a new booth (Admin only)
router.post(
  '/booths',
  protect,
  authorizeRoles('admin'),
  createBooth
);

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
