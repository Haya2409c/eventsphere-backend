
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Check user login and verify the token
const protect = async (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'Not authorized, no token provided'
        });
    }

    try {
        // Get token from request header
        const token = authHeader.split(' ')[1];

        // Verify token and get user information
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user without showing password
        const user = await User.findById(decoded.id).select('-password');

        if (!user || !user.isActive) {
            return res.status(401).json({
                message: 'Account disabled or not found'
            });
        }

        req.user = user;

        next();

    } catch (error) {
        return res.status(401).json({
            message: 'Not authorized, invalid token'
        });
    }
};


// Check whether user has permission to access a route
const authorizeRoles = (...roles) => {

    return (req, res, next) => {

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied: Role '${req.user.role}' cannot access this resource`
            });
        }

        next();
    };
};


// Make both functions available in other files
module.exports = {
    protect,
    authorizeRoles
};
