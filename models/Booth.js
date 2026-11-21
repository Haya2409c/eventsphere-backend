
const mongoose = require('mongoose');

// Booth Schema
const boothSchema = new mongoose.Schema(
  {
    // Expo associated with this booth
    expo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expo',
      required: [true, 'Expo reference is required'],
    },

    // Unique booth identification number
    boothNumber: {
      type: String,
      required: [true, 'Booth number is required'],
      trim: true,
    },

    // Location of the booth within the expo
    floorSection: {
      type: String,
      default: 'Main Hall',
      trim: true,
    },

    // Physical dimensions of the booth
    size: {
      type: String,
      default: '10x10 ft',
    },

    // Current booking status of the booth
    status: {
      type: String,
      enum: ['available', 'pending', 'booked'],
      default: 'available',
    },

    // User who has booked or reserved the booth
    exhibitor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Products or services displayed at the booth
    productsShowcase: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Export Booth model
module.exports = mongoose.model('Booth', boothSchema);
