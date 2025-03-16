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
        default: "No interests listed"
    },
    bio: {
        type: String,
        default: "No bio available"
    },
    profilePicture:{
        type: String,
         default: "/assets/default-profile.png"
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
