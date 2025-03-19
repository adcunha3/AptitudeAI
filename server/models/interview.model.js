const mongoose = require('mongoose');

const mockInterviewSchema = new mongoose.Schema({
    student: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    questions: [
        {
            questionText: { type: String, required: true },
            response: { type: String, required: true },
            feedback: { type: String, required: true },
            example_response: { type: String, required: true },
            // rating: { type: Number, min: 1, max: 10, required: true },
            // emotion: { type: String, required: true },
            timestamp: { type: Date, default: Date.now }
        }
    ],
    // finalRating: { type: Number, min: 1, max: 10, required: true },
    // finalEyeScore: { type: Number, min: 0, max: 100, required: true },
    // createdAt: { type: Date, default: Date.now }
});

const MockInterview = mongoose.model('MockInterview', mockInterviewSchema);
module.exports = MockInterview;
