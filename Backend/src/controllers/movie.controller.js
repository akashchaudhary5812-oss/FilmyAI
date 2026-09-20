const uploadFilm = require('../models/UploadFilm.model');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const s3Service = require('../services/s3.service');

function hasValidId(id) {
    return mongoose.isValidObjectId(id);
}

/**
 * Resolves private S3 keys or relative paths to fully authenticated, playable stream URLs.
 */
async function resolvePlayableMovie(movieDoc) {
    if (!movieDoc) return movieDoc;
    const movieObj = movieDoc.toObject ? movieDoc.toObject() : { ...movieDoc };

    // Set streamUrl endpoint
    movieObj.streamUrl = `/api/movie/${movieObj._id}/stream`;

    const rawUpload = movieObj.uploadFilm;
    let s3Key = movieObj.s3Key;

    if (!s3Key && typeof rawUpload === 'string' && rawUpload.includes('.amazonaws.com/')) {
        try {
            const urlObj = new URL(rawUpload);
            s3Key = decodeURIComponent(urlObj.pathname.replace(/^\/+/, ''));
        } catch (_) {}
    }

    if (s3Key && (movieObj.storageProvider === 'AWS_S3' || (typeof rawUpload === 'string' && rawUpload.includes('.amazonaws.com')))) {
        try {
            const presignedUrl = await s3Service.getPresignedUrl(s3Key, 86400); // 24 hours
            if (presignedUrl) {
                movieObj.uploadFilm = presignedUrl;
                movieObj.videoUrl = presignedUrl;
            }
        } catch (err) {
            console.warn(`[MovieController] Could not generate presigned URL for film ${movieObj._id}:`, err.message);
        }
    }

    return movieObj;
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

        const playableMovie = await resolvePlayableMovie(movie);
        return res.status(200).json({ filmFound: true, film: playableMovie });
    } catch (error) {
        console.error('[MovieController] Error in watchMovie:', error);
        return res.status(500).json({ message: 'Unable to retrieve movie' });
    }
}

async function streamMovie(req, res) {
    const id = req.params.id;
    if (!hasValidId(id)) return res.status(400).json({ message: 'Invalid movie id' });

    try {
        const movie = await uploadFilm.findById(id);
        if (!movie) return res.status(404).json({ message: 'Movie not found' });

        let s3Key = movie.s3Key;
        const rawUpload = movie.uploadFilm;

        if (!s3Key && typeof rawUpload === 'string' && rawUpload.includes('.amazonaws.com/')) {
            try {
                const urlObj = new URL(rawUpload);
                s3Key = decodeURIComponent(urlObj.pathname.replace(/^\/+/, ''));
            } catch (_) {}
        }

        // 1. If stored on AWS S3, redirect directly to fresh presigned GET URL (supports Range requests & fast CDN)
        if (s3Key && (movie.storageProvider === 'AWS_S3' || (typeof rawUpload === 'string' && rawUpload.includes('.amazonaws.com')))) {
            const presignedUrl = await s3Service.getPresignedUrl(s3Key, 86400);
            return res.redirect(302, presignedUrl);
        }

        // 2. If stored locally in uploads/ directory, support HTTP 206 Byte Range streaming
        let localPath = null;
        if (typeof rawUpload === 'string' && rawUpload.startsWith('/uploads/')) {
            localPath = path.join(__dirname, '../..', rawUpload);
        } else if (typeof rawUpload === 'string' && fs.existsSync(rawUpload)) {
            localPath = rawUpload;
        }

        if (localPath && fs.existsSync(localPath)) {
            const stat = fs.statSync(localPath);
            const fileSize = stat.size;
            const range = req.headers.range;

            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunksize = (end - start) + 1;
                const file = fs.createReadStream(localPath, { start, end });
                const head = {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': 'video/mp4',
                };
                res.writeHead(206, head);
                file.pipe(res);
            } else {
                const head = {
                    'Content-Length': fileSize,
                    'Content-Type': 'video/mp4',
                };
                res.writeHead(200, head);
                fs.createReadStream(localPath).pipe(res);
            }
            return;
        }

        // 3. Fallback redirect to raw URL
        if (rawUpload && typeof rawUpload === 'string' && rawUpload.startsWith('http')) {
            return res.redirect(302, rawUpload);
        }

        return res.status(404).json({ message: 'Stream source not available' });
    } catch (error) {
        console.error('[MovieController] Stream error:', error);
        return res.status(500).json({ message: 'Error streaming video' });
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

        // Resolve S3 playable URLs for movies
        const resolvedMovies = await Promise.all(movies.map(m => resolvePlayableMovie(m)));

        return res.status(200).json({ allMovies: true, movies: resolvedMovies });
    } catch (error) {
        console.error('[MovieController] Error in getAllMovies:', error);
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
    streamMovie,
    deleteMovie,
    getAllMovies,
    getFilmStatus,
    getFilmReport
};
