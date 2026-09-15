const express = require("express");
const router = express.Router();
const UploadFilmController = require("../controllers/UploadFilm.controller");
const multer = require("multer");
const path = require("path");
const storage = multer.memoryStorage();

const allowedVideoExtensions = new Set([".mp4", ".mov", ".webm", ".avi", ".mkv", ".mpeg", ".mpg"]);

const upload = multer({
    storage: storage,
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const isVideo = file.mimetype.startsWith("video/") && allowedVideoExtensions.has(extension);

        if (!isVideo) {
            return callback(new Error("Only video files are allowed. Upload an MP4, MOV, WEBM, AVI, MKV, or MPEG video."));
        }
        return callback(null, true);
    },
});

router.post("/uploadFilm", (req, res, next) => {
    upload.single("uploadFilm")(req, res, (error) => {
        if (!error) return next();
        if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({ status: false, message: "Video files must be 500MB or smaller." });
        }
        return res.status(400).json({ status: false, message: error.message || "Only video files are allowed." });
    });
}, UploadFilmController.uploadFilm);

module.exports = router;
