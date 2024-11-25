const express = require('express');
const { spawn } = require('child_process');
const router = express.Router();

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
                return reject(new Error('Python script exited with error.'));
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

router.post('/process-frame', async (req, res) => {
    const { frame } = req.body;

    // Validate the input frame
    if (!frame || typeof frame !== 'string' || !frame.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Invalid frame format. Expected Base64-encoded image.' });
    }

    try {
        const result = await runPythonScript(frame);
        res.status(200).json(result);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
