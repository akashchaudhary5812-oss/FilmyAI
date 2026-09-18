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
        const movies = await uploadFilm.find().sort({ createdAt: -1 });
        return res.status(200).json({ allMovies: true, movies });
    } catch (error) {
        return res.status(500).json({ message: 'Unable to retrieve movies' });
    }
}

async function getFilmStatus(req, res) {
    const id = req.params.id;
    if (!hasValidId(id)) return res.status(400).json({ status: false, message: 'Invalid film id' });
    try {
        const movie = await uploadFilm.findById(id).select('FilmName processingStatus analysisProgress ragReady processingError timings');
        if (!movie) return res.status(404).json({ status: false, message: 'Film not found' });

        return res.status(200).json({
            status: true,
            filmId: movie._id,
            title: movie.FilmName,
            processingStatus: movie.processingStatus || 'PENDING',
            analysisProgress: movie.analysisProgress || 0,
            ragReady: Boolean(movie.ragReady),
            timings: movie.timings || {},
            error: movie.processingError || null
        });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message || 'Unable to retrieve processing status' });
    }
}

async function getFilmReport(req, res) {
    const id = req.params.id;
    if (!hasValidId(id)) return res.status(400).json({ status: false, message: 'Invalid film id' });
    try {
        const movie = await uploadFilm.findById(id);
        if (!movie) return res.status(404).json({ status: false, message: 'Film not found' });

        if (!movie.report && movie.processingStatus !== 'COMPLETED') {
            return res.status(202).json({
                status: false,
                isProcessing: true,
                processingStatus: movie.processingStatus,
                message: 'Analysis is still in progress. Please poll status endpoint.'
            });
        }

        if (!movie.report) {
            return res.status(404).json({
                status: false,
                message: 'Report not found or analysis failed to produce report data.'
            });
        }

        return res.status(200).json({
            status: true,
            filmId: movie._id,
            report: movie.report
        });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message || 'Unable to retrieve film report' });
    }
}

module.exports = {
    watchMovie,
    deleteMovie,
    getAllMovies,
    getFilmStatus,
    getFilmReport
};
