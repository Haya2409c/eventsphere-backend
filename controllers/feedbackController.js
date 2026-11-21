
const Feedback = require('../models/Feedback');

// Submit feedback for an expo (Attendee/Exhibitor)
const submitFeedback = async (req, res) => {
  try {
    const { expo, rating, comment } = req.body;

    // Save the user's feedback
    const feedback = await Feedback.create({
      user: req.user._id,
      expo,
      rating,
      comment,
    });

    res.status(201).json({
      message: 'Thank you for your feedback!',
      feedback,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get all feedback submitted by users (Admin only)
const getAllFeedbacks = async (req, res) => {
  try {
    // Fetch feedback with user and expo details
    const feedbacks = await Feedback.find()
      .populate('user', 'name email role digitalPassId')
      .populate('expo', 'title');

    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Add an admin reply to user feedback (Admin only)
const replyFeedback = async (req, res) => {
  try {
    // Find the feedback by its ID
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        message: 'Feedback not found',
      });
    }

    // Save the admin's reply
    feedback.adminReply = req.body.adminReply;

    await feedback.save();

    res.json({
      message: 'Reply added',
      feedback,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Export all feedback controller functions
module.exports = {
  submitFeedback,
  getAllFeedbacks,
  replyFeedback,
};
