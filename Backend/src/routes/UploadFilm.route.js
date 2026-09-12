const express = require("express");
const router = express.Router();
const UploadFilmController = require("../controllers/UploadFilm.controller");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
});


router.post("/uploadFilm", upload.single("uploadFilm"), UploadFilmController.uploadFilm);

module.exports = router;