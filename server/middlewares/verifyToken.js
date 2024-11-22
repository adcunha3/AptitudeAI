const config = require("../config/auth.config.js");
const jwt = require("jsonwebtoken");

const checkToken = (req, res, next) => {
    const token = req.headers["authorization"] && req.headers["authorization"].split(" ")[1];
    
    if (!token) {
        return res.status(403).send({ message: "No token provided." });
    }

    jwt.verify(token, config.secret, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "Token unauthorized." });
        }
        req.userId = decoded.id;
        next();
    });
};

const verifyToken = {
    checkToken
};

module.exports = verifyToken;
