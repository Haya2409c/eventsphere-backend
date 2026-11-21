
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User schema defines the information stored for each user
const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },

    password: {
        type: String,
        required: true,
        minlength: 6
    },

    role: {
        type: String,
        enum: ['admin', 'exhibitor', 'attendee'],
        default: 'attendee'
    },

    // Create a unique digital pass for every user
    digitalPassId: {
        type: String,
        unique: true
    },

    // Store user interests for smart matchmaking
    interests: [{
        type: String
    }],

    // Save exhibitor company information
    companyName: {
        type: String,
        default: ''
    },

    companyCategory: {
        type: String,
        default: ''
    },

    // Admin can approve or reject exhibitors
    isApproved: {
        type: Boolean,
        default: true
    },

    // Check whether the user account is active
    isActive: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });


// Generate digital pass and encrypt password before saving
userSchema.pre('save', async function () {

    if (!this.digitalPassId) {
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        this.digitalPassId = `ESP-${randomNum}`;
    }

    // Only hash password when it is changed
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

});


// Check the entered password during login
userSchema.methods.matchPassword = async function (enteredPassword) {

    return await bcrypt.compare(enteredPassword, this.password);

};


// Export User model so it can be used in other files
module.exports = mongoose.model('User', userSchema);
