const UploadFilmModel = require('../models/UploadFilm.model');
const imagekit = require('../services/imagekit.service');

async function uploadFilm(req, res) {
    const { FilmName, DirectorName, ProductionHouses, Casting, Budget, Genre, Script, Summary } = req.body;

    const filmUrl = await imagekit.uploadFile(req.file.buffer, `${FilmName}_${Date.now()}.jpg`);

    const newFilm = new UploadFilmModel({
        uploadFilm: filmUrl,
        FilmName,
        DirectorName,
        ProductionHouses,
        Casting,
        Budget,
        Genre,
        Script,
        Summary
    });

    const newFilmData = await newFilm.save();

    res.status(201).json({
        status: true,
        message: "Film uploaded successfully",
        data: newFilmData
    })
}

module.exports = {
    uploadFilm,
};