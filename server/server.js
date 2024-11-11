const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieSession = require('cookie-session');

const {connectDB} = require('./config/db.config.js');

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
app.use(express.json());
app.use(bodyParser.json());     
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession(
    {
      name: "bezkoder-session",
      keys: ["COOKIE_SECRET"],
      httpOnly: true
    }
)); 

// Test route
app.get("/", (req, res) => {
    res.json({ message: "Welcome to aptitudeai's application." });
});

// Routes
require("./routes/auth.routes.js")(app);

app.listen(3000, () => { console.log('App running on port 3000'); });
