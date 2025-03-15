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

exports.getAllProfiles = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        
        if (users.length === 0) {
            return res.status(404).send({ message: "No users found" });
        }

        const usersWithAvgScores = users.map(user => {
            const averageScore = user.userScore.length > 0 
                ? (user.userScore.reduce((acc, score) => acc + score, 0) / user.userScore.length).toFixed(2)
                : 0;
            
            return {
                ...user.toObject(),
                averageScore: parseFloat(averageScore)
            };
        });

        usersWithAvgScores.sort((a, b) => b.averageScore - a.averageScore);

        res.send(usersWithAvgScores);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const updatedData = {
            bio: req.body.bio,
            interests: req.body.interests
        };

        const user = await User.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(req.params.id) }, 
            updatedData, 
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
