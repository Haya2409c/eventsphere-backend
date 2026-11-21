
const Session = require('../models/Session');
const Expo = require('../models/Expo');

// Create a new workshop or session (Admin only)
const createSession = async (req, res) => {
  try {
    const session = await Session.create(req.body);

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all sessions with expo, topic, and title filters
const getSessions = async (req, res) => {
  try {
    const { expoId, topic, search } = req.query;

    const query = {};

    // Filter sessions by expo
    if (expoId) {
      query.expo = expoId;
    }

    // Search sessions by topic
    if (topic) {
      query.topic = {
        $regex: topic,
        $options: 'i',
      };
    }

    // Search sessions by title
    if (search) {
      query.title = {
        $regex: search,
        $options: 'i',
      };
    }

    const sessions = await Session.find(query).populate(
      'expo',
      'title location'
    );

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Register an attendee for an expo
const registerForExpo = async (req, res) => {
  try {
    // Find the selected expo
    const expo = await Expo.findById(req.params.expoId);

    if (!expo) {
      return res.status(404).json({
        message: 'Expo not found',
      });
    }

    // Check whether the user is already registered
    if (expo.registeredAttendees.includes(req.user._id)) {
      return res.status(400).json({
        message: 'Already registered for this Expo',
      });
    }

    // Add the attendee to the expo registration list
    expo.registeredAttendees.push(req.user._id);

    await expo.save();

    res.json({
      message: 'Successfully registered for Expo',
      digitalPassId: req.user.digitalPassId,
      expoTitle: expo.title,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a session to the attendee's personal schedule
const bookmarkSession = async (req, res) => {
  try {
    // Find the selected session
    const session = await Session.findById(req.params.sessionId);

    if (!session) {
      return res.status(404).json({
        message: 'Session not found',
      });
    }

    // Check whether the session is already bookmarked
    if (session.registeredAttendees.includes(req.user._id)) {
      return res.status(400).json({
        message: 'Session already in your schedule',
      });
    }

    // Add the attendee to the session registration list
    session.registeredAttendees.push(req.user._id);

    await session.save();

    res.json({
      message: 'Session added to your personal schedule',
      session,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get the attendee's personal schedule and recommended sessions
const getMyScheduleAndRecommendations = async (req, res) => {
  try {
    // Get all sessions bookmarked by the current user
    const mySessions = await Session.find({
      registeredAttendees: req.user._id,
    }).populate('expo', 'title');

    // Get the user's interests for personalized recommendations
    const userInterests = req.user.interests || [];

    // Find sessions matching the user's interests
    const recommendedSessions = await Session.find({
      topic: {
        $in: userInterests.map((interest) => new RegExp(interest, 'i')),
      },
    }).populate('expo', 'title');

    res.json({
      digitalPassId: req.user.digitalPassId,
      mySessions,
      recommendedSessions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export all session controller functions
module.exports = {
  createSession,
  getSessions,
  registerForExpo,
  bookmarkSession,
  getMyScheduleAndRecommendations,
};
