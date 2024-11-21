const controller = require("../controllers/auth.controller.js");
const profileController = require("../controllers/profile.controller.js");
const verifyToken = require("../middlewares/verifyToken.js");
const verifySignUp = require("../middlewares/verifySignUp.js");

module.exports = function(app) {
    app.use(function(req, res, next) {
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, Content-Type, Accept"
      );
      next();
    });

    app.post("/api/auth/signup", [verifySignUp.checkDuplicateUsernameOrEmail], controller.signup);
    app.post("/api/auth/signin", controller.signin);
    app.post("/api/auth/signout", controller.signout);

    app.get("/api/profile/:id", [verifyToken.checkToken], profileController.getProfile); 
    app.put("/api/profile/:id", [verifyToken.checkToken], profileController.updateProfile); 
}