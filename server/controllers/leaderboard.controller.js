const User = require('../models/user.model.js');

exports.getScore = async (req, res) => {
    const { userId } = req.body;
    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const scores = user.userScore; 

        const average = scores.length > 0 ? (scores.reduce((acc, rating) => acc + rating, 0) / scores.length).toFixed(2) : 0;

        res.status(200).json({
            userScore: scores,  
            average: parseFloat(average),
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateScore = async (req, res) => {
    const { userId, rating } = req.body;
    if (typeof rating !== 'number' || rating < 1 || rating > 10) {
        return res.status(400).json({ message: 'Rating must be a number between 1 and 10.' });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.userScore) {
            user.userScore = [];
        }

        user.userScore.push(rating); 
        await user.save();

        res.status(200).json({
            message: 'Review added successfully',
            userScore: user.userScore,  
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};