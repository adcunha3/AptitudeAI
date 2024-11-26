const express = require('express');
const { processFrame } = require('../controllers/interview.controller.js');  // Import the controller

const router = express.Router();

// Define the /api/process-frame route to call the controller
router.post('/process-frame', processFrame);  // Use the controller's function to handle the request

module.exports = router;
