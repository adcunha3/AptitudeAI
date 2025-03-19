const mongoose = require("mongoose"); 
const axios = require("axios");  // To call the AI model
const Feedback = require("../models/interview.model");

// ✅ Save Feedback to Database
// const saveFeedback = async (req, res) => {

//     console.log("🟢 Request received:", req.body);

//     try {
//         let { user_id, questionText, response } = req.body;

//         if (!user_id || !response) {
//             return res.status(400).json({ error: "Missing user ID or response" });
//         }

//         if (!mongoose.Types.ObjectId.isValid(user_id)) {
//             return res.status(400).json({ error: "❌ Invalid user_id format" });
//         }
//         const studentObjectId = new mongoose.Types.ObjectId(user_id);

//         console.log("🟢 Calling AI Model with response:", response);

//         const aiResponse = await getAIResponse(response);  // ✅ Get AI feedback
//         const { feedback, example_response, follow_up } = aiResponse;

//         console.log("🟢 Saving to MongoDB...");

//         const newFeedback = new Feedback({
//             student: studentObjectId,
//             questions: [
//                 {
//                     questionText,
//                     response,
//                     feedback,
//                     example_response
//                 }
//             ],
//         });

//         await newFeedback.save();
//         console.log("✅ Feedback saved successfully!");

//         res.json({ message: "Feedback saved successfully!", ...aiResponse });
//     } catch (error) {
//         console.error("❌ Error saving feedback:", error);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// };

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

const getFeedbackHistory = async (req, res) => {
    try {
        const { user_id } = req.params;
        if (!user_id) {
            return res.status(400).json({ error: "Missing user ID" });
        }

        const interviews = await Feedback.find({ student: user_id }).sort({ createdAt: -1 });
        res.json(interviews);
    } catch (error) {
        console.error("❌ Error fetching interview history:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { saveFeedback, getFeedbackHistory };