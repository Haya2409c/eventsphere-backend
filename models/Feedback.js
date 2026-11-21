
const mongoose = require('mongoose');

// Feedback Schema
const feedbackSchema = new mongoose.Schema(
  {
    // User who submitted the feedback
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },

    // Expo related to this feedback
    expo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expo',
      required: [true, 'Expo reference is required'],
    },

    // Rating given by the user (1 to 5 stars)
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },

    // User's feedback or experience
    comment: {
      type: String,
      required: [true, 'Feedback comment is required'],
      trim: true,
    },

    // Reply provided by the admin
    adminReply: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Export Feedback model
module.exports = mongoose.model('Feedback', feedbackSchema);
