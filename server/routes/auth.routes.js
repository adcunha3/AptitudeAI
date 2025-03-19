const controller = require("../controllers/auth.controller.js");
const profileController = require("../controllers/profile.controller.js");
const leaderboardController = require("../controllers/leaderboard.controller.js");
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

    // Authentication Routes
    app.post("/api/auth/signup", [verifySignUp.checkDuplicateUsernameOrEmail], controller.signup);
    app.post("/api/auth/signin", controller.signin);
    app.post("/api/auth/signout", controller.signout);

    // Profile Routes
    app.get("/api/profile/:id", [verifyToken.checkToken], profileController.getProfile);
    app.get("/api/profiles", [verifyToken.checkToken], profileController.getAllMentorProfiles); 
    app.put("/api/profile/:id", [verifyToken.checkToken], profileController.updateProfile); 

    // Leaderboard Routes
    app.get("/api/leaderboard", [verifyToken.checkToken], leaderboardController.getScore);
    app.post("/api/leaderboard", [verifyToken.checkToken], leaderboardController.updateScore);

    app.post("/api/auth/change-password", [verifyToken.checkToken], profileController.changePassword);
}