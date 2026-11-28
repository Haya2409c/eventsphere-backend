
const Expo = require('../models/Expo');
const Booth = require('../models/Booth');
const User = require('../models/User');
const Session = require('../models/Session');
const Feedback = require('../models/Feedback');
const { escapeRegex, rejectMissing, sendError } = require('../utils/validate');

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

    if (rejectMissing(res, req.body, [
      'title', 'description', 'theme', 'location', 'startDate', 'endDate',
    ])) return;

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
    sendError(res, error);
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
        $regex: escapeRegex(search),
        $options: 'i',
      };
    }

    // Filter expos by theme
    if (theme) {
      query.theme = {
        $regex: escapeRegex(theme),
        $options: 'i',
      };
    }

    const expos = await Expo.find(query).populate(
      'createdBy',
      'name email'
    );

    res.json(expos);
  } catch (error) {
    sendError(res, error);
  }
};

// Fields an admin may set on an expo
const EXPO_FIELDS = ['title', 'description', 'theme', 'location', 'startDate', 'endDate'];

// Get one expo by its ID
const getExpoById = async (req, res) => {
  try {
    const expo = await Expo.findById(req.params.id).populate('createdBy', 'name email');

    if (!expo) {
      return res.status(404).json({ message: 'Expo not found' });
    }

    res.json(expo);
  } catch (error) {
    sendError(res, error);
  }
};

// Update an expo (Admin only). Only the fields sent are changed.
const updateExpo = async (req, res) => {
  try {
    const expo = await Expo.findById(req.params.id);

    if (!expo) {
      return res.status(404).json({ message: 'Expo not found' });
    }

    EXPO_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) expo[field] = req.body[field];
    });

    // save() runs the model's checks, so an empty title still gets a 400
    await expo.save();

    res.json(expo);
  } catch (error) {
    sendError(res, error);
  }
};

// Delete an expo and its booths + sessions (Admin only)
const deleteExpo = async (req, res) => {
  try {
    const expo = await Expo.findById(req.params.id);

    if (!expo) {
      return res.status(404).json({ message: 'Expo not found' });
    }

    // Delete the children first: if this fails, the expo is still there to retry
    const [booths, sessions] = await Promise.all([
      Booth.deleteMany({ expo: expo._id }),
      Session.deleteMany({ expo: expo._id }),
      Feedback.deleteMany({ expo: expo._id }),
    ]);

    await expo.deleteOne();

    res.json({
      message: 'Expo deleted',
      deletedBooths: booths.deletedCount,
      deletedSessions: sessions.deletedCount,
    });
  } catch (error) {
    sendError(res, error);
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

    if (rejectMissing(res, req.body, ['expo', 'boothNumber'])) return;

    const booth = await Booth.create({
      expo,
      boothNumber,
      floorSection,
      size,
    });

    res.status(201).json(booth);
  } catch (error) {
    sendError(res, error);
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
    sendError(res, error);
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
    sendError(res, error);
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

    // Only a request waiting for approval can be approved or rejected
    if (booth.status !== 'pending' || !booth.exhibitor) {
      return res.status(400).json({ message: 'This booth has no pending request' });
    }

    // Update booth status
    booth.status = req.body.status || 'booked';

    // Clear exhibitor details if the request is rejected
    if (booth.status === 'available') clearBooth(booth);

    await booth.save();

    res.json({
      message: `Booth status updated to ${booth.status}`,
      booth,
    });
  } catch (error) {
    sendError(res, error);
  }
};

// Fields an admin may set on a booth
const BOOTH_FIELDS = ['boothNumber', 'floorSection', 'size', 'status'];

// Empty a booth so it can be booked again
const clearBooth = (booth) => {
  booth.status = 'available';
  booth.exhibitor = null;
  booth.productsShowcase = '';
  booth.staff = [];
};

// Edit a booth or assign an exhibitor to it (Admin only)
// Send exhibitor: "<userId>" to assign (booth becomes booked), or exhibitor: null to free it.
const updateBooth = async (req, res) => {
  try {
    const booth = await Booth.findById(req.params.id);

    if (!booth) {
      return res.status(404).json({ message: 'Booth not found' });
    }

    BOOTH_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) booth[field] = req.body[field];
    });

    const { exhibitor: exhibitorId, status } = req.body;

    // Refuse mixed-up requests instead of quietly picking one meaning
    if (exhibitorId === null && status !== undefined && status !== 'available') {
      return res.status(400).json({ message: 'A pending or booked booth needs an exhibitor' });
    }
    if (status === 'available' && exhibitorId) {
      return res.status(400).json({ message: 'An available booth cannot have an exhibitor' });
    }

    if (exhibitorId === null || status === 'available') {
      clearBooth(booth);
    } else if (exhibitorId !== undefined) {
      const exhibitor = await User.findById(exhibitorId);

      if (!exhibitor || exhibitor.role !== 'exhibitor') {
        return res.status(400).json({ message: 'Exhibitor not found' });
      }

      // New owner: don't keep the old company's products and staff
      if (!exhibitor._id.equals(booth.exhibitor)) {
        booth.productsShowcase = '';
        booth.staff = [];
      }

      booth.exhibitor = exhibitor._id;
      // Assigning directly means booked, unless the admin chose a status
      if (req.body.status === undefined) booth.status = 'booked';
    }

    // A pending or booked booth must belong to someone
    if (booth.status !== 'available' && !booth.exhibitor) {
      return res.status(400).json({ message: 'Choose an exhibitor for a pending or booked booth' });
    }

    // save() runs the model's checks (e.g. a wrong status gets a 400)
    await booth.save();

    res.json(booth);
  } catch (error) {
    sendError(res, error);
  }
};

// Delete a booth (Admin only)
const deleteBooth = async (req, res) => {
  try {
    const booth = await Booth.findByIdAndDelete(req.params.id);

    if (!booth) {
      return res.status(404).json({ message: 'Booth not found' });
    }

    res.json({ message: 'Booth deleted' });
  } catch (error) {
    sendError(res, error);
  }
};

// Owner exhibitor edits their booth's products and staff
const updateBoothDetails = async (req, res) => {
  try {
    const booth = await Booth.findById(req.params.id);

    if (!booth) {
      return res.status(404).json({ message: 'Booth not found' });
    }

    // Only the exhibitor who holds this booth may change it
    if (!booth.exhibitor || !booth.exhibitor.equals(req.user._id)) {
      return res.status(403).json({ message: 'This is not your booth' });
    }

    const { productsShowcase, staff } = req.body;

    if (staff !== undefined && !Array.isArray(staff)) {
      return res.status(400).json({ message: 'staff must be a list' });
    }

    if (productsShowcase !== undefined) booth.productsShowcase = productsShowcase;
    if (staff !== undefined) booth.staff = staff;

    // save() checks that every staff member has a name
    await booth.save();

    res.json(booth);
  } catch (error) {
    sendError(res, error);
  }
};

// Booths held by the logged-in exhibitor (pending + booked)
const getMyBooths = async (req, res) => {
  try {
    const booths = await Booth.find({ exhibitor: req.user._id })
      .populate('expo', 'title location startDate endDate');

    res.json(booths);
  } catch (error) {
    sendError(res, error);
  }
};

// Count one view of a booth (an attendee opened it on the floor map)
const addBoothView = async (req, res) => {
  try {
    const booth = await Booth.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!booth) {
      return res.status(404).json({ message: 'Booth not found' });
    }

    res.json({ views: booth.views });
  } catch (error) {
    sendError(res, error);
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
            $regex: escapeRegex(keyword),
            $options: 'i',
          },
        },
        {
          companyCategory: {
            $regex: escapeRegex(keyword),
            $options: 'i',
          },
        },
        {
          name: {
            $regex: escapeRegex(keyword),
            $options: 'i',
          },
        },
      ];
    }

    const exhibitors = await User.find(query).select('-password');

    res.json(exhibitors);
  } catch (error) {
    sendError(res, error);
  }
};

// Export all expo and booth controller functions
module.exports = {
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
};
