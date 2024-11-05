const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    ratings: [{ type: Number }], // List of ratings (1-10) received by a customer
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }], // List of review IDs
    studentsTaught: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }] // List of student IDs
});

const Mentor = mongoose.model('Professor', mentorSchema);
module.exports = Mentor;
