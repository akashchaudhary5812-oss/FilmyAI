const express = require('express');
const app = express();
const userRoutes = require('./routes/user.route');
const UploadFilmRoutes = require('./routes/UploadFilm.route');
const movieRoutes = require('./routes/movie.route');

app.use(express.json());

app.use('/api/auth', userRoutes);
app.use('/api/film', UploadFilmRoutes);
app.use('/api', movieRoutes);

module.exports = app;