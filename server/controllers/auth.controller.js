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

exports.signin = async (req, res) => {
    try {
        const user = await User.findOne({username: req.body.username});
        if (!user) {
            return res.status(404).send({ message: "User Not found." });
        }

        const passwordIsValid = bcrypt.compareSync(
            req.body.password,
            user.password
        );
        if (!passwordIsValid) {
            return res.status(401).send({ message: "Invalid Password." });
        }

        const token = jwt.sign(
            { id: user.id },
            config.secret,
            {
                algorithm: 'HS256',
                allowInsecureKeySizes: true,
                expiresIn: 86400, // 24hrs
            }
        );
        req.session.token = token;
        req.session.username = user.username;

        res.status(200).send({
            id: user._id,
            username: user.username,
            email: user.email,
            roles: user.roles,
            token: token
        });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error occurred while logging in." });
    }
}

exports.signout = async (req, res) => {
    try {
        const username = req.session.username;
        req.session = null;

        return res.status(200).send({ message: `${username} has been signed out.` });
    } catch (err) {
        this.next(err);
    }
};
