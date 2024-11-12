const User = require("../models/user.model.js");

const checkDuplicateUsernameOrEmail = (req, res, next) => {
    const username = User.findOne({ username: req.body.username });
    if (username) {
        res.status(400).send({ message: "Error: Username is already in use." });
        return;
    }

    const email = User.findOne({ email: req.body.email });
    if (email) {
        res.status(400).send({ message: "Error: Email is already in use." });
        return;
    }
    next();
};

const verifySignUp = {
    checkDuplicateUsernameOrEmail
};

module.exports = verifySignUp;
