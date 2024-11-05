const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    professor: { type: mongoose.Schema.Types.ObjectId, ref: 'Professor', required: true },
    rating: { type: Number, required: true, min: 1, max: 10 },
    feedback: { type: String }
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
