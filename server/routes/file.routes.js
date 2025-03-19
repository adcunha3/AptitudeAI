const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const Grid = require("gridfs-stream");
const { Readable } = require("stream");

const router = express.Router();

let gfs, gridfsBucket;

mongoose.connection.once("open", () => {
    gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: "uploads",
    });
    gfs = Grid(mongoose.connection.db, mongoose.mongo);
    gfs.collection("uploads");
    console.log("GridFS initialized.");
});

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

  router.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = req.body.userId;
    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }

    try {
        const readableStream = new Readable();
        readableStream.push(req.file.buffer);
        readableStream.push(null);

        const uploadStream = gridfsBucket.openUploadStream(req.file.originalname, {
            contentType: req.file.mimetype,
            metadata: { userId }
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
        // Check if the file exists
        const fileCursor = gfs.files.find({ filename: req.params.filename });
        const file = await fileCursor.next();

        if (!file) {
            console.error("File not found:", req.params.filename);
            return res.status(404).json({ message: "File not found" });
        }

        console.log("Streaming file:", file.filename);

        res.setHeader("Content-Type", "video/webm"); // Set MIME type

        const readStream = gridfsBucket.openDownloadStream(file._id);

        readStream.on("error", (err) => {
            console.error("Read stream error:", err.message);
            res.status(500).json({ error: err.message });
        });

        readStream.on("data", (chunk) => {
            console.log("Streaming chunk:", chunk.length, "bytes");
        });

        readStream.on("end", () => {
            console.log("Stream complete.");
        });

        readStream.pipe(res);
    } catch (err) {
        console.error("Error streaming file:", err.message);
        res.status(500).json({ error: err.message });
    }
});

router.get("/file/:userId/videos", async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!mongoose.connection.db) {
            return res.status(500).json({ message: "Database not connected" });
        }

        const filesCollection = mongoose.connection.db.collection("uploads.files");
        const files = await filesCollection.find({ "metadata.userId": userId }).toArray();

        if (!files || files.length === 0) {
            return res.status(404).json({ message: "No videos found for this user" });
        }

        const videos = files.map(file => ({
            _id: file._id,
            filename: file.filename,
            url: `http://localhost:3000/api/files/file/${file.filename}/view`
        }));

        res.status(200).json(videos);
    } catch (err) {
        console.error("Error fetching user videos:", err.message);
        res.status(500).json({ error: err.message });
    }
});

router.get("/file/:filename/download", async (req, res) => {
    try {
        const fileCursor = gfs.files.find({ filename: req.params.filename });
        const file = await fileCursor.next();

        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }

        res.setHeader("Content-Type", "video/webm");
        res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);

        const readStream = gridfsBucket.openDownloadStream(file._id);
        readStream.pipe(res);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
