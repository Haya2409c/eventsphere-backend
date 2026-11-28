
const Session = require('../models/Session');
const Expo = require('../models/Expo');
const { escapeRegex, rejectMissing, sendError } = require('../utils/validate');

// Fields an admin may set on a session (the client can't set registeredAttendees)
const SESSION_FIELDS = [
  'expo', 'title', 'description', 'speakerName', 'topic',
  'hallLocation', 'date', 'startTime', 'endTime',
];

// Create a new workshop or session (Admin only)
const createSession = async (req, res) => {
  try {
    if (rejectMissing(res, req.body, SESSION_FIELDS)) return;

    const data = {};
    SESSION_FIELDS.forEach((field) => { data[field] = req.body[field]; });

    const session = await Session.create(data);

    res.status(201).json(session);
  } catch (error) {
    sendError(res, error);
  }
};

// Update a session (Admin only). Only the fields sent are changed.
const updateSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    SESSION_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) session[field] = req.body[field];
    });

    // save() runs the model's checks, so an empty field still gets a 400
    await session.save();

    res.json(session);
  } catch (error) {
    sendError(res, error);
  }
};

// Delete a session (Admin only)
const deleteSession = async (req, res) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json({ message: 'Session deleted' });
  } catch (error) {
    sendError(res, error);
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
        $regex: escapeRegex(topic),
        $options: 'i',
      };
    }

    // Search sessions by title
    if (search) {
      query.title = {
        $regex: escapeRegex(search),
        $options: 'i',
      };
    }

    const sessions = await Session.find(query).populate(
      'expo',
      'title location'
    );

    res.json(sessions);
  } catch (error) {
    sendError(res, error);
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
    sendError(res, error);
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
    sendError(res, error);
  }
};

// Remove a session from the attendee's personal schedule
const unbookmarkSession = async (req, res) => {
  try {
    // $pull removes this user's ID from the list (does nothing if it's not there)
    const session = await Session.findByIdAndUpdate(
      req.params.sessionId,
      { $pull: { registeredAttendees: req.user._id } },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json({
      message: 'Session removed from your personal schedule',
      session,
    });
  } catch (error) {
    sendError(res, error);
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
        $in: userInterests.map((interest) => new RegExp(escapeRegex(interest), 'i')),
      },
    }).populate('expo', 'title');

    res.json({
      digitalPassId: req.user.digitalPassId,
      mySessions,
      recommendedSessions,
    });
  } catch (error) {
    sendError(res, error);
  }
};

// Export all session controller functions
module.exports = {
  createSession,
  updateSession,
  deleteSession,
  getSessions,
  registerForExpo,
  bookmarkSession,
  unbookmarkSession,
  getMyScheduleAndRecommendations,
};
