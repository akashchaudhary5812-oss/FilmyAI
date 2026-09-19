const express = require("express");
const router = express.Router();
const UploadFilmController = require("../controllers/UploadFilm.controller");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadsBaseDir = path.join(__dirname, "../../uploads");
const videoUploadDir = path.join(uploadsBaseDir, "videos");
const bannerUploadDir = path.join(uploadsBaseDir, "banners");
const castUploadDir = path.join(uploadsBaseDir, "cast");

[videoUploadDir, bannerUploadDir, castUploadDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Disk storage routes video, banner, and cast files to organized directories
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === "bannerImage") {
            cb(null, bannerUploadDir);
        } else if (file.fieldname === "CastImage" || file.fieldname === "castImages" || file.fieldname === "castImage") {
            cb(null, castUploadDir);
        } else {
            cb(null, videoUploadDir);
        }
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeBase = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, "_");
        cb(null, `${safeBase}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`);
    }
});

const allowedVideoExtensions = new Set([".mp4", ".mov", ".webm", ".avi", ".mkv", ".mpeg", ".mpg", ".m4v"]);
const allowedImageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

const upload = multer({
    storage: storage,
    limits: { 
        fileSize: 20 * 1024 * 1024 * 1024 // 20 GB limit to support large films
    },
    fileFilter: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        
        if (file.fieldname === "uploadFilm") {
            const isVideo = file.mimetype.startsWith("video/") || allowedVideoExtensions.has(extension);
            if (!isVideo) {
                return callback(new Error("Only video files are allowed for uploadFilm. Upload an MP4, MOV, WEBM, AVI, MKV, or MPEG video."));
            }
            return callback(null, true);
        }

        if (file.fieldname === "bannerImage" || file.fieldname === "CastImage" || file.fieldname === "castImages" || file.fieldname === "castImage") {
            const isImage = file.mimetype.startsWith("image/") || allowedImageExtensions.has(extension);
            if (!isImage) {
                return callback(new Error(`Only image files (.jpg, .jpeg, .png, .webp) are allowed for ${file.fieldname}.`));
            }
            return callback(null, true);
        }

        // Default accept
        return callback(null, true);
    },
});

const uploadFields = upload.fields([
    { name: "uploadFilm", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
    { name: "CastImage", maxCount: 25 },
    { name: "castImages", maxCount: 25 },
    { name: "castImage", maxCount: 25 }
]);

router.post("/uploadFilm", (req, res, next) => {
    const contentType = req.headers["content-type"] || "";
    if (contentType.includes("multipart/form-data")) {
        uploadFields(req, res, (error) => {
            if (!error) {
                // Ensure backwards compatibility for code expecting req.file
                if (req.files && req.files["uploadFilm"] && req.files["uploadFilm"][0]) {
                    req.file = req.files["uploadFilm"][0];
                }
                return next();
            }
            if (error.code === "LIMIT_FILE_SIZE") {
                return res.status(413).json({ status: false, message: "Uploaded file exceeds maximum limit." });
            }
            return res.status(400).json({ status: false, message: error.message || "File upload validation error." });
        });
    } else {
        // Direct JSON or URL body
        next();
    }
}, UploadFilmController.uploadFilm);

module.exports = router;

