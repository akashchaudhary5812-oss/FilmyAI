const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movie.controller');

router.get('/movie/:id', movieController.watchMovie);
router.delete('/movie/:id', movieController.deleteMovie);
router.get('/All_movies', movieController.getAllMovies);

// ── Pipeline Status & Report Endpoints ─────────────────────────────────
router.get('/film/:id/status', movieController.getFilmStatus);
router.get('/film/:id/report', movieController.getFilmReport);

module.exports = router;