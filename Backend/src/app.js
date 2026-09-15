const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();

const userRoutes = require('./routes/user.route');
const UploadFilmRoutes = require('./routes/UploadFilm.route');
const movieRoutes = require('./routes/movie.route');

// ── CORS ─────────────────────────────────────────────────────────────
// Allow the Next.js frontend origin (configured via FRONTEND_URL env var)
// Falls back to permissive dev mode when not set.
const FRONTEND_URL = process.env.FRONTEND_URL || '';

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (!FRONTEND_URL || (origin && origin === FRONTEND_URL)) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
    } else if (!FRONTEND_URL) {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Cookie');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

// ── Middleware ────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Health Check ──────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'FilmyAI Backend', version: '1.0.0' });
});

// ── Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', userRoutes);
app.use('/api/film', UploadFilmRoutes);
app.use('/api', movieRoutes);

module.exports = app;