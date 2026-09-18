const express = require("express");
const router = express.Router();
const UploadFilmController = require("../controllers/UploadFilm.controller");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../uploads/videos");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Disk storage ensures large video files (100MB to multi-gigabytes) stream directly to disk without RAM overhead
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeBase = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, "_");
        cb(null, `${safeBase}_${Date.now()}${ext}`);
    }
});

const allowedVideoExtensions = new Set([".mp4", ".mov", ".webm", ".avi", ".mkv", ".mpeg", ".mpg", ".m4v"]);

const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 * 1024 }, // 20 GB limit to support films of any size
    fileFilter: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const isVideo = file.mimetype.startsWith("video/") || allowedVideoExtensions.has(extension);

        if (!isVideo) {
            return callback(new Error("Only video files are allowed. Upload an MP4, MOV, WEBM, AVI, MKV, or MPEG video."));
        }
        return callback(null, true);
    },
});

router.post("/uploadFilm", (req, res, next) => {
    const contentType = req.headers["content-type"] || "";
    if (contentType.includes("multipart/form-data")) {
        upload.single("uploadFilm")(req, res, (error) => {
            if (!error) return next();
            if (error.code === "LIMIT_FILE_SIZE") {
                return res.status(413).json({ status: false, message: "Video file exceeds 20GB maximum limit." });
            }
            return res.status(400).json({ status: false, message: error.message || "Only video files are allowed." });
        });
    } else {
        // Direct JSON or URL body
        next();
    }
}, UploadFilmController.uploadFilm);

module.exports = router;
