const { spawn } = require('child_process');

// Utility function to run the Python script
const runPythonScript = (frame) => {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', ['ai/computer-vision/test.py'], {
            env: { ...process.env, TF_CPP_MIN_LOG_LEVEL: '3', TF_ENABLE_ONEDNN_OPTS: '0' },
        });
        let scriptOutput = '';

        // Send frame to the Python script
        pythonProcess.stdin.write(JSON.stringify({ frame }));
        pythonProcess.stdin.end();

        // Collect output from Python script
        pythonProcess.stdout.on('data', (data) => {
            scriptOutput += data.toString();
        });

        pythonProcess.stderr.on('data', (error) => {
            const errorMessage = error.toString();
            console.error(`Error from Python script: ${errorMessage}`);
            reject(new Error(errorMessage));
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error('Python script exited with an error.'));
            }
            try {
                const result = JSON.parse(scriptOutput);
                resolve(result);
            } catch (parseError) {
                reject(new Error('Failed to parse Python script output.'));
            }
        });

        // Set a timeout to kill the process if it hangs
        const timeout = setTimeout(() => {
            pythonProcess.kill('SIGTERM'); // Terminate the process
            reject(new Error('Python script timeout.'));
        }, 60000); // 10 seconds

        pythonProcess.on('close', () => clearTimeout(timeout)); // Cleanup timeout
    });
};

exports.processFrame = async (req, res) => {
    const { frame } = req.body;

    // Validate the input frame
    if (!frame || typeof frame !== 'string' || !frame.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Invalid frame format. Expected Base64-encoded image.' });
    }

    try {
        const result = await runPythonScript(frame);

        // Extract required fields from the Python script output
        const { eye_contact = 0, body_language = 0, emotion_score = 0, overall_score = 0 } = result;

        // Send only the required fields back to the client
        res.status(200).json({
            eye_contact,
            body_language,
            emotion_score,
            overall_score,
        });
    } catch (err) {
        console.error('Error processing frame:', err.message);
        res.status(500).json({ error: err.message });
    }
};
