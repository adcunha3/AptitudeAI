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
    profilePicture:{
        type: String
    },
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
