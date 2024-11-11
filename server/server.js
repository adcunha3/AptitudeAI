import express from 'express';
import * as dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import connectDB from './config/db.config.js';
import cookieSession from 'cookie-session';


dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
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
res.json({ message: "Welcome to bezkoder application." });
});

app.listen(3000, () => { console.log('App running on port 3000'); });
