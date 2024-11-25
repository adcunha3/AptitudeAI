const mongoose = require("mongoose");
const Grid = require("gridfs-stream");

// Initialize GridFS
let gfs;
const conn = mongoose.connection;
conn.once("open", () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection("uploads");
});

// Controller functions
const uploadFile = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }
    res.status(200).json({
        file: req.file,
        message: "File uploaded successfully",
    });
};

const getFileMetadata = (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        if (!file || file.length === 0) {
            return res.status(404).json({ message: "No file exists" });
        }
        res.json(file);
    });
};

const streamFile = (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        if (!file || file.length === 0) {
            return res.status(404).json({ message: "No file exists" });
        }

        if (
            file.contentType === "image/jpeg" ||
            file.contentType === "image/png" ||
            file.contentType.includes("video")
        ) {
            const readStream = gfs.createReadStream(file.filename);
            readStream.pipe(res);
        } else {
            res.status(404).json({ message: "Not an image or video" });
        }
    });
};

module.exports = { uploadFile, getFileMetadata, streamFile };
