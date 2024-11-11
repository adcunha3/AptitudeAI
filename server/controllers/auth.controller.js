const config = require("../config/auth.config.js");
const Role = require("../models/role.model.js");
const User = require("../models/user.model.js");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.signup = async (req, res) => {
    try {
        const role = await Role.findOne({ name: req.body.roles });

        if (!role) {
            return res.status(400).send({ message: "Role not found." });
        }

        const user = new User({
            username: req.body.username,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 8),
            roles: [role._id]
        });

        await user.save();
        res.send({ message: "User was registered successfully!" });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error occurred while registering the user." });
    }
}
