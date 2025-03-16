const User = require('../models/user.model.js');
const mongoose = require('mongoose');

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) }).select('-password');
        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }
        res.send(user);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.getAllMentorProfiles = async (req, res) => {
    try {
        const mentors = await User.find({ role: 'mentor' }).select('-password');

        if (mentors.length === 0) {
            return res.status(404).send({ message: "No mentors found" });
        }

        const mentorsWithAvgScores = mentors.map(mentor => {
            const averageScore = mentor.userScore.length > 0 
                ? (mentor.userScore.reduce((acc, score) => acc + score, 0) / mentor.userScore.length).toFixed(2)
                : 0;

            return {
                ...mentor.toObject(),
                averageScore: parseFloat(averageScore)
            };
        });

        mentorsWithAvgScores.sort((a, b) => b.averageScore - a.averageScore);

        res.send(mentorsWithAvgScores);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const updatedData = {
            username: req.body.username, // ✅ Allow username change
            role: req.body.role || "User",
            bio: req.body.bio || "No bio available",
            interests: req.body.interests || "No interests listed",
            profilePicture: req.body.profilePicture || "assets/default-profile.png"
        };

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updatedData },
            { new: true }
        ).select('-password');
        

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }
        res.send(user);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};
