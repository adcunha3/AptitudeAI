const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    reviewsGiven: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }], // List of reviews the student has written
    mockInterviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MockInterview' }] // List of mock interviews conducted by the student
});

const Customer = mongoose.model('Student', customerSchema);
module.exports = Customer;
