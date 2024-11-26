const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieSession = require('cookie-session');
const fs = require('fs'); // Add this line to import the fs module

const { connectDB } = require('./config/db.config.js');
const processFrameRoute = require('./routes/interview.routes.js'); // Update path as needed

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

// Increase the request size limit
app.use(express.json({ limit: '10mb' }));  // Allow up to 10MB for JSON payloads
app.use(bodyParser.json({ limit: '10mb' }));  // Allow up to 10MB for JSON payloads
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));  // Allow up to 10MB for URL-encoded payloads

app.use(cookieSession({
  name: "aptitude-session",
  keys: ["COOKIE_SECRET"],
  httpOnly: true
}));

app.use('/api', processFrameRoute);  // Use /api to prefix all routes defined in interview.routes.js

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to aptitudeai's application." });
});

// Routes
require("./routes/auth.routes.js")(app);

app.listen(3000, () => { console.log('App running on port 3000'); });

module.exports = { app };
