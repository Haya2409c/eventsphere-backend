
const Expo = require('../models/Expo');
const Booth = require('../models/Booth');
const User = require('../models/User');

// Create a new expo (Admin only)
const createExpo = async (req, res) => {
  try {
    const {
      title,
      description,
      theme,
      location,
      startDate,
      endDate,
    } = req.body;

    const expo = await Expo.create({
      title,
      description,
      theme,
      location,
      startDate,
      endDate,
      createdBy: req.user._id,
    });

    res.status(201).json(expo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all expos with search and theme filters
const getAllExpos = async (req, res) => {
  try {
    const { search, theme } = req.query;

    const query = {};

    // Search expos by title
    if (search) {
      query.title = {
        $regex: search,
        $options: 'i',
      };
    }

    // Filter expos by theme
    if (theme) {
      query.theme = {
        $regex: theme,
        $options: 'i',
      };
    }

    const expos = await Expo.find(query).populate(
      'createdBy',
      'name email'
    );

    res.json(expos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new booth for an expo (Admin only)
const createBooth = async (req, res) => {
  try {
    const {
      expo,
      boothNumber,
      floorSection,
      size,
    } = req.body;

    const booth = await Booth.create({
      expo,
      boothNumber,
      floorSection,
      size,
    });

    res.status(201).json(booth);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all booths belonging to a specific expo
const getBoothsByExpo = async (req, res) => {
  try {
    const booths = await Booth.find({
      expo: req.params.expoId,
    }).populate(
      'exhibitor',
      'name companyName companyCategory email'
    );

    res.json(booths);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Submit a booth booking request (Exhibitor only)
const requestBooth = async (req, res) => {
  try {
    // Check whether the exhibitor is approved
    if (!req.user.isApproved) {
      return res.status(403).json({
        message: 'Your exhibitor account is pending Admin approval',
      });
    }

    // Find the requested booth
    const booth = await Booth.findById(req.params.boothId);

    if (!booth) {
      return res.status(404).json({
        message: 'Booth not found',
      });
    }

    // Check whether the booth is available
    if (booth.status !== 'available') {
      return res.status(400).json({
        message: 'Booth is already requested or booked',
      });
    }

    // Assign the exhibitor and submit the request
    booth.exhibitor = req.user._id;
    booth.status = 'pending';
    booth.productsShowcase = req.body.productsShowcase || '';

    await booth.save();

    res.json({
      message: 'Booth request submitted',
      booth,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve or reject a booth booking request (Admin only)
const approveBooth = async (req, res) => {
  try {
    const booth = await Booth.findById(req.params.boothId);

    if (!booth) {
      return res.status(404).json({
        message: 'Booth not found',
      });
    }

    // Update booth status
    booth.status = req.body.status || 'booked';

    // Clear exhibitor details if the request is rejected
    if (booth.status === 'available') {
      booth.exhibitor = null;
      booth.productsShowcase = '';
    }

    await booth.save();

    res.json({
      message: `Booth status updated to ${booth.status}`,
      booth,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search approved exhibitors by company name or category
const searchExhibitors = async (req, res) => {
  try {
    const { keyword } = req.query;

    const query = {
      role: 'exhibitor',
      isApproved: true,
    };

    // Search by company name, category, or exhibitor name
    if (keyword) {
      query.$or = [
        {
          companyName: {
            $regex: keyword,
            $options: 'i',
          },
        },
        {
          companyCategory: {
            $regex: keyword,
            $options: 'i',
          },
        },
        {
          name: {
            $regex: keyword,
            $options: 'i',
          },
        },
      ];
    }

    const exhibitors = await User.find(query).select('-password');

    res.json(exhibitors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export all expo and booth controller functions
module.exports = {
  createExpo,
  getAllExpos,
  createBooth,
  getBoothsByExpo,
  requestBooth,
  approveBooth,
  searchExhibitors,
};
