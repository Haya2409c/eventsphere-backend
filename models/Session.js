
const mongoose = require('mongoose');

// Session Schema
const sessionSchema = new mongoose.Schema(
  {
    // Expo associated with this session
    expo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expo',
      required: [true, 'Expo reference is required'],
    },

    // Basic session information
    title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true,
    },

    description: {
      type: String,
      required: [true, 'Session description is required'],
      trim: true,
    },

    // Speaker details
    speakerName: {
      type: String,
      required: [true, 'Speaker name is required'],
      trim: true,
    },

    // Session topic or category
    topic: {
      type: String,
      required: [true, 'Session topic is required'],
      trim: true,
    },

    // Session venue
    hallLocation: {
      type: String,
      required: [true, 'Hall location is required'],
      trim: true,
    },

    // Session schedule
    date: {
      type: String,
      required: [true, 'Session date is required'],
    },

    startTime: {
      type: String,
      required: [true, 'Session start time is required'],
    },

    endTime: {
      type: String,
      required: [true, 'Session end time is required'],
    },

    // Users registered for this session
    registeredAttendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Export Session model
module.exports = mongoose.model('Session', sessionSchema);
