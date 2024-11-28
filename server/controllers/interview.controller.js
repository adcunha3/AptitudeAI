// const fs = require('fs');
// const { exec } = require('child_process');

// // Controller function to process the frame
// const processFrame = (req, res) => {
//     console.log("Received a POST request to /api/process-frame");

//     const frame = req.body.frame;

//     if (!frame) {
//         console.error("No frame provided in the request body.");
//         return res.status(400).json({ error: "No frame provided" });
//     }

//     // Strip the data URL prefix if present
//     const base64Data = frame.startsWith("data:image")
//         ? frame.split(',')[1]
//         : frame;

//     if (!base64Data) {
//         console.error("Invalid image data in the frame field.");
//         return res.status(400).json({ error: "Invalid image data" });
//     }

//     const imagePath = './temp_image.png';

//     // Decode and save the image
//     try {
//         const imageBuffer = Buffer.from(base64Data, 'base64');
//         fs.writeFileSync(imagePath, imageBuffer); // Save image to file
//         console.log(`Image saved to ${imagePath}`);
//     } catch (error) {
//         console.error("Failed to decode and save the image.", error);
//         return res.status(500).json({ error: "Failed to process image" });
//     }

//     // Execute the Python script
//     const scriptPath = '/Users/sriraamthiru/Documents/AptitudeAI/server/ai/computer-vision/test.py';
//     const command = `python ${scriptPath} "${imagePath}"`;
//     console.log(`Executing command: ${command}`);

//     exec(command, (error, stdout, stderr) => {
//         if (error) {
//             console.error(`Error executing Python script: ${error.message}`);
//             console.error(stderr);
//             return res.status(500).json({ error: "Python script execution failed", details: stderr });
//         }

//         console.log("Python script executed successfully.");
//         console.log(`stdout: ${stdout}`);

//         try {
//             const result = JSON.parse(stdout);
//             console.log("Parsed JSON result:", result);

//             // After processing, delete the temp image file
//             fs.unlink(imagePath, (err) => {
//                 if (err) {
//                     console.error("Failed to delete temp image file:", err);
//                 } else {
//                     console.log("Temp image file deleted successfully.");
//                 }
//             });

//             res.json(result);  // Return the JSON result to the client
//         } catch (parseError) {
//             console.error("Failed to parse JSON from Python script output.");
//             console.error(parseError);
//             res.status(500).json({ error: "Failed to parse Python script output" });
//         }
//     });
// };

// module.exports = { processFrame };

const axios = require('axios');

// Controller function to process the frame
const processFrame = async (req, res) => {
    console.log("Received a POST request to /api/process-frame");

    const { frame } = req.body;

    // Validate the frame from the frontend
    if (!frame || typeof frame !== 'string' || !frame.startsWith('data:image/')) {
        console.error("Invalid or missing frame in request.");
        return res.status(400).json({ error: "Invalid frame format. Expected Base64-encoded image." });
    }

    // Extract Base64 data (remove the "data:image/..." prefix)
    const base64Data = frame.split(',')[1];
    if (!base64Data) {
        console.error("Invalid Base64 image data.");
        return res.status(400).json({ error: "Invalid Base64 image data." });
    }

    try {
        // Send the Base64 frame to the Flask server
        const response = await axios.post('http://localhost:5000/process-frame', { frame: base64Data });

        // Log the Flask server response
        console.log("Flask server response:", response.data);

        // Return the processed scores to the frontend
        return res.status(200).json(response.data);
    } catch (error) {
        // Handle errors from the Flask server or the request itself
        console.error("Error communicating with Flask server:", error.message);

        if (error.response) {
            // Flask server returned an error
            return res.status(error.response.status).json({ error: error.response.data });
        }

        // General error
        return res.status(500).json({ error: "Failed to process frame." });
    }
};

module.exports = { processFrame };
