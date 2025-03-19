const mongoose = require("mongoose"); 
const axios = require("axios");  // To call the AI model
const Feedback = require("../models/interview.model");

const saveFeedback = async (req, res) => {
    try {
        console.log("🟢 Request received:", req.body);

        let { user_id, questionText, response, feedback, example_response } = req.body;
        if (!user_id || !questionText || !response || !feedback || !example_response) {
            console.error("❌ Missing required fields");
            return res.status(400).json({ error: "❌ Missing required fields" });
        }

        // ✅ Validate user_id format
        if (!mongoose.isValidObjectId(user_id)) {
            console.error("❌ Invalid user_id format:", user_id);
            return res.status(400).json({ error: "❌ Invalid user_id format. Expected a valid ObjectId." });
        }
        const studentObjectId = new mongoose.Types.ObjectId(user_id);

        console.log("🟢 Saving to MongoDB...");
        const newFeedback = new Feedback({
            student: studentObjectId,
            questions: [{ questionText, response, feedback, example_response }],
        });

        await newFeedback.save();
        console.log("✅ Feedback saved successfully!");

        res.json({ message: "✅ Feedback saved successfully!" });
    } catch (error) {
        console.error("❌ Error saving feedback:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const getFeedbackByUser = async (req, res) => {
    try {
        const user_id = req.params.user_id;

        if (!mongoose.isValidObjectId(user_id)) {
            return res.status(400).json({ error: "❌ Invalid user ID format." });
        }

        const feedbacks = await Feedback.find({ student: user_id }).sort({ createdAt: -1 });

        if (!feedbacks.length) {
            return res.status(404).json({ message: "No feedback found for this user." });
        }

        res.json(feedbacks);
    } catch (error) {
        console.error("❌ Error fetching feedback:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { saveFeedback, getFeedbackByUser };