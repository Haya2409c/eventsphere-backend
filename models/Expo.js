
const mongoose = require('mongoose');

// Expo Schema
const expoSchema = new mongoose.Schema(
  {
    // Basic expo information
    title: {
      type: String,
      required: [true, 'Expo title is required'],
      trim: true,
    },

    description: {
      type: String,
      required: [true, 'Expo description is required'],
      trim: true,
    },

    theme: {
      type: String,
      required: [true, 'Expo theme is required'],
      trim: true,
    },

    // Expo venue
    location: {
      type: String,
      required: [true, 'Venue location is required'],
      trim: true,
    },

    // Expo schedule
    startDate: {
      type: String,
      required: [true, 'Start date is required'],
    },

    endDate: {
      type: String,
      required: [true, 'End date is required'],
    },

    // User who created the expo
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Expo creator is required'],
    },

    // Users registered for the expo
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

// Export Expo model
module.exports = mongoose.model('Expo', expoSchema);
