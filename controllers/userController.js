
const User = require('../models/User');


// Update user profile and interests
// Route: PUT /api/users/profile
exports.updateProfile = async (req, res) => {
    try {

        // Find the logged-in user
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // Update user information
        user.name = req.body.name || user.name;
        user.interests = req.body.interests || user.interests;
        user.companyName = req.body.companyName || user.companyName;
        user.companyCategory = req.body.companyCategory || user.companyCategory;

        // Save updated profile
        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            digitalPassId: updatedUser.digitalPassId,
            interests: updatedUser.interests
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// Get all registered users (Admin only)
// Route: GET /api/users
exports.getAllUsers = async (req, res) => {
    try {

        // Get users without their passwords
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });

        res.json(users);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// Update exhibitor approval and account status (Admin only)
// Route: PATCH /api/users/:id/status
exports.updateUserStatus = async (req, res) => {
    try {

        // Find user by ID
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // Update approval status if provided
        if (req.body.isApproved !== undefined) {
            user.isApproved = req.body.isApproved;
        }

        // Update account status if provided
        if (req.body.isActive !== undefined) {
            user.isActive = req.body.isActive;
        }

        // Save changes in database
        await user.save();

        res.json({
            message: 'User status updated successfully',
            user
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};
