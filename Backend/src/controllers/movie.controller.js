const uploadFilm = require('../models/UploadFilm.model');
const mongoose = require('mongoose');

function hasValidId(id) {
    return mongoose.isValidObjectId(id);
}

async function watchMovie(req, res) {
    const id = req.params.id;
    if (!hasValidId(id)) {
        return res.status(400).json({ message: 'Invalid movie id' });
    }
    try {
        const movie = await uploadFilm.findById(id);
        if (!movie) return res.status(404).json({ message: 'Movie not found' });
        return res.status(200).json({ filmFound: true, film: movie });
    } catch (error) {
        return res.status(500).json({ message: 'Unable to retrieve movie' });
    }

}

async function deleteMovie(req, res) {
    const id = req.params.id;
    if (!hasValidId(id)) return res.status(400).json({ message: 'Invalid movie id' });
    try {
        const movie = await uploadFilm.findByIdAndDelete(id);
        if (!movie) return res.status(404).json({ message: 'Movie not found' });
        return res.status(200).json({ filmDeleted: true, film: movie });
    } catch (error) {
        return res.status(500).json({ message: 'Unable to delete movie' });
    }
}

async function getAllMovies(req, res) {
    try {
        const movies = await uploadFilm.find();
        return res.status(200).json({ allMovies: true, movies });
    } catch (error) {
        return res.status(500).json({ message: 'Unable to retrieve movies' });
    }
}

module.exports = {
    watchMovie,
    deleteMovie,
    getAllMovies
};
