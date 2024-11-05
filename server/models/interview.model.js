const mongoose = require('mongoose');

const mockInterviewSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    timestamp: { type: Date, default: Date.now },
    rating: { type: Number, min: 1, max: 10 },
    feedback: { type: String }
});

const MockInterview = mongoose.model('MockInterview', mockInterviewSchema);
module.exports = MockInterview;
