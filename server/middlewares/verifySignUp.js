const User = require("../models/user.model.js");

const checkDuplicateUsernameOrEmail = async (req, res, next) => {
    try {
        const username = await User.findOne({ username: req.body.username });
        if (username) {
            return res.status(400).send({ message: "Error: Username is already in use." });
        }

        const email = await User.findOne({ email: req.body.email });
        if (email) {
            return res.status(400).send({ message: "Error: Email is already in use." });
        }

        next();
    } catch (error) {
        return res.status(500).send({ message: error.message || "Some error occurred while checking for duplicates." });
    }
};

const verifySignUp = {
    checkDuplicateUsernameOrEmail
};

module.exports = verifySignUp;
