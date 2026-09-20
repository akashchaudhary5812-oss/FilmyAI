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

        // Auto-backfill rating for films completed before the rating field was added
        if (movie.report && (movie.rating === null || movie.rating === undefined)) {
            const modelRating =
                movie.report.executive_summary?.overall_film_rating ??
                movie.report.raw_ml_predictions?.predicted_commercial_score ??
                null;
            if (typeof modelRating === 'number') {
                movie.rating = Number(modelRating.toFixed(1));
                await uploadFilm.findByIdAndUpdate(id, { rating: movie.rating });
            }
        }

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

        // Auto-backfill rating for any completed film that has a report but no rating yet
        const backfillOps = movies
            .filter(m => m.report && (m.rating === null || m.rating === undefined))
            .map(m => {
                const modelRating =
                    m.report.executive_summary?.overall_film_rating ??
                    m.report.raw_ml_predictions?.predicted_commercial_score ??
                    null;
                if (typeof modelRating === 'number') {
                    return uploadFilm.findByIdAndUpdate(m._id, {
                        rating: Number(modelRating.toFixed(1))
                    }).then(() => { m.rating = Number(modelRating.toFixed(1)); });
                }
                return null;
            })
            .filter(Boolean);

        if (backfillOps.length > 0) {
            await Promise.all(backfillOps);
        }

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

        // Auto-backfill rating field for films completed before the rating field was added
        if (movie.rating === null || movie.rating === undefined) {
            const modelRating =
                movie.report.executive_summary?.overall_film_rating ??
                movie.report.raw_ml_predictions?.predicted_commercial_score ??
                null;
            if (typeof modelRating === 'number') {
                await uploadFilm.findByIdAndUpdate(id, {
                    rating: Number(modelRating.toFixed(1))
                });
            }
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
