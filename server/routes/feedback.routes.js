const express = require("express");
const { saveFeedback, getFeedbackByUser } = require("../controllers/feedback.controller");

const router = express.Router();

// ✅ Save User Feedback
router.post("/evaluate-response", saveFeedback);

// ✅ Get Feedback History
router.get("/feedback-history/:user_id", getFeedbackByUser);

module.exports = router;