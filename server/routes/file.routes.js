const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const Grid = require("gridfs-stream");
const { Readable } = require("stream");

const router = express.Router();

// Initialize GridFS
let gfs, gridfsBucket;

mongoose.connection.once("open", () => {
    gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: "uploads",
    });
    gfs = Grid(mongoose.connection.db, mongoose.mongo);
    gfs.collection("uploads");
    console.log("GridFS initialized.");
});

// Configure Multer to handle file uploads in memory
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'video/webm' || file.mimetype === 'video/webm') {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'));
      }
    },
  });

// Upload file route
router.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }

    try {
        const readableStream = new Readable();
        readableStream.push(req.file.buffer);
        readableStream.push(null);

        const uploadStream = gridfsBucket.openUploadStream(req.file.originalname, {
            contentType: req.file.mimetype,
            metadata: {
                userId: userId,
            },
        });

        readableStream.pipe(uploadStream);

        uploadStream.on("finish", (file) => {
            console.log("File successfully uploaded:", file);
            res.status(200).json({
                file,
                message: "File uploaded successfully",
            });
        });

        uploadStream.on("error", (err) => {
            console.error("Upload stream error:", err.message);
            res.status(500).json({ error: err.message });
        });
    } catch (err) {
        console.error("Upload error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Get file metadata route
router.get("/file/:filename", async (req, res) => {
    try {
        const file = await gfs.files.findOne({ filename: req.params.filename });
        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }

        console.log("File metadata:", file);
        res.status(200).json(file);
    } catch (err) {
        console.error("Error fetching file metadata:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Stream file route
router.get("/file/:filename/view", async (req, res) => {
    try {
        const file = await gfs.files.findOne({ filename: req.params.filename });
        console.log(file); // Check if file is found
        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }

        const readStream = gridfsBucket.openDownloadStream(file._id);
        console.log(readStream);

        readStream.on("error", (err) => {
            console.error("Read stream error:", err.message);
            res.status(500).json({ error: err.message });
        });

        readStream.pipe(res);
    } catch (err) {
        console.error("Error streaming file:", err.message);
        res.status(500).json({ error: err.message });
    }
});

router.get("/file/:id/videos", async (req, res) => {
    const userId = req.params.id;

    try {
        const files = await gfs.files.find({ "metadata.userId": userId }).toArray();

        if (files.length === 0) {
            return res.status(404).json({ message: "No videos found for this user." });
        }

        const videoFiles = files.map(file => ({
            _id: file._id,
            filename: file.filename,
            contentType: file.contentType,
            uploadDate: file.uploadDate,
        }));

        res.status(200).json(videoFiles);
    } catch (err) {
        console.error("Error fetching videos:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Delete video route
router.delete("/file/:filename", async (req, res) => {
    try {
        const filename = req.params.filename;

        // Find file by filename
        const file = await gfs.files.findOne({ filename });
        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }

        // Delete the file using ObjectId
        await gridfsBucket.delete(file._id);

        res.status(200).json({ message: "File deleted successfully" });
    } catch (err) {
        console.error("Error deleting file:", err.message);
        res.status(500).json({ error: err.message });
    }
});
  
module.exports = router;
