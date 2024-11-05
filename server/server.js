import express from 'express';
import * as dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import connectDB from './config/database.js';

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());     
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(3000, () => { console.log('App running on port 3000'); });
