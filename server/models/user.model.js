const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    interests: {
        type: String,
    },
    bio: {
        type: String,
    },
    profilePicture: {
        type: String
    },
    userScore: {
        type: [Number],
        validate: {
            validator: function(arr) {
                return arr.every((rating) => rating >= 1 && rating <= 10);
            },
            message: 'Ratings should be between 1 and 10.'
        }
    }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
