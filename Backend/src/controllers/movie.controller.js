const uploadFilm = require('../models/UploadFilm.model');

async function watchMovie(req, res) {
    const id = req.params.id;
    const movie = await uploadFilm.findById(id);
    if (!movie) {
        return res.status(404).json({ message: 'Movie not found' });
    }

    res.status(200).json({
        filmFound: true,
        film: movie
    })

}

async function deleteMovie(req, res) {
    const id = req.params.id;
    const movie = await uploadFilm.findByIdAndDelete(id);

    res.status(200).json({
        filmDeleted: true,
        film: movie
    })
}

async function getAllMovies(req, res) {
    const movies = await uploadFilm.find();

    res.status(200).json({
        allMovies: true,
        movies: movies
    })
}

module.exports = {
    watchMovie,
    deleteMovie,
    getAllMovies
};