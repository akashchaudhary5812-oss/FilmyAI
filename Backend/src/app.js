const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();

const userRoutes = require('./routes/user.route');
const UploadFilmRoutes = require('./routes/UploadFilm.route');
const movieRoutes = require('./routes/movie.route');

// ── CORS ─────────────────────────────────────────────────────────────
// Allow frontend origin dynamically (Next.js on port 4000/3000/3001 or FRONTEND_URL)
const FRONTEND_URL = process.env.FRONTEND_URL || '';

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        // Echo back the request origin for credentials support in dev/prod
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', FRONTEND_URL || '*');
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Cookie,X-Requested-With,Accept,Origin,Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range,Content-Length,Accept-Ranges,ETag');
    
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

const path = require('path');

// ── Static Files (Local Video Storage & Uploads) ──────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', userRoutes);
app.use('/api/film', UploadFilmRoutes);
app.use('/api', movieRoutes);

module.exports = app;