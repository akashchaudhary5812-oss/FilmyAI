const UploadFilmModel = require('../models/UploadFilm.model');
const imagekit = require('../services/imagekit.service');
const path = require('path');

async function uploadFilm(req, res) {
    try {
        const { FilmName, DirectorName, ProductionHouses, Casting, Budget, Genre, Script, Summary } = req.body || {};
        if (!req.file) return res.status(400).json({ status: false, message: 'A film file is required' });
        if (!FilmName || !DirectorName || !ProductionHouses || !Casting || !Budget || !Genre) return res.status(400).json({ status: false, message: 'Missing required film metadata' });

        const extension = path.extname(req.file.originalname).toLowerCase();
        const fileName = `${FilmName.replace(/[^a-z0-9-_]/gi, '_')}_${Date.now()}${extension}`;
        const filmUrl = await imagekit.uploadFile(req.file.buffer, fileName);
        const newFilmData = await new UploadFilmModel({ uploadFilm: filmUrl, FilmName, DirectorName, ProductionHouses, Casting, Budget, Genre, Script, Summary }).save();
        return res.status(201).json({ status: true, message: 'Film uploaded successfully', data: newFilmData });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message || 'Unable to upload film' });
    }
}

module.exports = {
    uploadFilm,
};
