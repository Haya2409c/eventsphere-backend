
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { rejectMissing, sendError } = require('../utils/validate');

// Generate login token for the user
const generateToken = (id, role) => {
    return jwt.sign(
        { id, role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};


// Register a new user
// Route: POST /api/auth/register
exports.registerUser = async (req, res) => {
    try {

        const {
            name,
            email,
            password,
            role,
            interests,
            companyName,
            companyCategory
        } = req.body;

        if (rejectMissing(res, req.body, ['name', 'email', 'password'])) return;

        // Must be plain text, not objects like { "$ne": null } (NoSQL injection)
        if ([name, email, password].some((value) => typeof value !== 'string')) {
            return res.status(400).json({
                message: 'Name, email and password must be text'
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                message: 'Please enter a valid email'
            });
        }

        // Only attendee or exhibitor can sign up. Admins are made by the seed script.
        const allowedRoles = ['attendee', 'exhibitor'];
        if (role !== undefined && !allowedRoles.includes(role)) {
            return res.status(400).json({
                message: 'Role must be attendee or exhibitor'
            });
        }

        // Check if email is already registered
        const existingUser = await User.findOne({ email: email.trim().toLowerCase() });

        if (existingUser) {
            return res.status(400).json({
                message: 'User already exists with this email'
            });
        }

        // Exhibitors need admin approval
        const isApproved = role === 'exhibitor' ? false : true;

        // Save new user in database
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'attendee',
            interests: interests || [],
            companyName: companyName || '',
            companyCategory: companyCategory || '',
            isApproved
        });

        // Send user details and login token
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            digitalPassId: user.digitalPassId,
            interests: user.interests,
            isApproved: user.isApproved,
            token: generateToken(user._id, user.role)
        });

    } catch (error) {
        sendError(res, error);
    }
};


// Login user with email and password
// Route: POST /api/auth/login
exports.loginUser = async (req, res) => {
    try {

        const { email, password } = req.body;

        if (rejectMissing(res, req.body, ['email', 'password'])) return;

        // Must be plain text, not objects like { "$ne": null } (NoSQL injection)
        if (typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({
                message: 'Email and password must be text'
            });
        }

        // Find user by email
        const user = await User.findOne({ email: email.trim().toLowerCase() });

        // Check email and password
        if (user && await user.matchPassword(password)) {

            // Check if account is active
            if (!user.isActive) {
                return res.status(403).json({
                    message: 'Your account has been suspended by Admin.'
                });
            }

            // Return user information with token
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                digitalPassId: user.digitalPassId,
                interests: user.interests,
                isApproved: user.isApproved,
                token: generateToken(user._id, user.role)
            });

        } else {
            res.status(401).json({
                message: 'Invalid email or password'
            });
        }

    } catch (error) {
        sendError(res, error);
    }
};


// Get details of the logged-in user
// Route: GET /api/auth/me
exports.getMe = async (req, res) => {

    res.json(req.user);

};
