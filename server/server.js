const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieSession = require('cookie-session');
const fs = require('fs');
const { connectDB } = require('./config/db.config.js');
const feedbackRoutes = require("./routes/feedback.routes.js");

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:4200"],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

app.use(cookieSession({
  name: "aptitude-session",
  keys: ["COOKIE_SECRET"],
  httpOnly: true
}));

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to aptitudeai's application." });
});

// Routes
require("./routes/auth.routes.js")(app);
app.use("/api/files", require("./routes/file.routes")); // File upload routes
app.use("/api/feedback", feedbackRoutes);


app.listen(3000, () => { console.log('App running on port 3000'); });

module.exports = { app };
