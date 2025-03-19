const User = require('../models/user.model.js');
const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");

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
            const scores = mentor.userScore.map(entry => entry.score); // Extract only the score values

            const averageScore = scores.length > 0 
                ? (scores.reduce((acc, score) => acc + score, 0) / scores.length).toFixed(2)
                : null; // If no scores exist, keep it null

            return {
                ...mentor.toObject(),
                averageScore: averageScore !== null ? parseFloat(averageScore) : null, // Ensure correct formatting
                studentsHelped: scores.length // Count of students helped
            };
        });

        mentorsWithAvgScores.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0)); // Handle null values

        res.send(mentorsWithAvgScores);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const updatedData = {
            username: req.body.username, //Allow username change
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

exports.changePassword = async (req, res) => {
    try {
        console.log("🔍 Received change password request:", req.body);

        const { userId, currentPassword, newPassword } = req.body;

        if (!userId || !currentPassword || !newPassword) {
            console.error("Missing required fields:", req.body);
            return res.status(400).json({ message: "Missing required fields" });
        }

        
        const user = await User.findById(userId);
        if (!user) {
            console.error("User not found:", userId);
            return res.status(404).json({ message: "User not found." });
        }

        //Check if the current password is correct
        const passwordIsValid = bcrypt.compareSync(currentPassword, user.password);
        if (!passwordIsValid) {
            console.error("Invalid current password for user:", userId);
            return res.status(401).json({ message: "Current password is incorrect." });
        }

        
        const hashedPassword = bcrypt.hashSync(newPassword, 8); //Hash new password
        user.password = hashedPassword;
        await user.save(); 

        console.log("Password changed successfully for user:", userId);
        return res.status(200).json({ message: "Password changed successfully." });

    } catch (err) {
        console.error("Error in changePassword API:", err);
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
};

