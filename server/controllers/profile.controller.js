const User = require('../models/user.model');


exports.getProfile = async (req, res) => {
    try {
        const user = await User.findOne(req.params.username).select('-password'); // Exclude password field
        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }
        res.send(user);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};


exports.updateProfile = async (req, res) => {
    try {
        const updatedData = {
            username: req.body.usernamename,
            email: req.body.email,
            role: req.body.role,
            bio: req.body.bio,
            interests: req.body.interests,
        };

        const user = await User.findOneAndUpdate(req.params.username, updatedData, { new: true }).select('-password');
        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }
        res.send(user);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};
