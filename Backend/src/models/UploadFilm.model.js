const mongoose = require('mongoose');

const uploadFilmSchema = new mongoose.Schema({

    uploadFilm: {
        type: String,
        required: true
    },

    FilmName: {
        type: String,
        required: true
    },

    DirectorName: {
        type: String,
        required: true
    },

    ProductionHouses: {
        type: [String],
        required: true
    },

    Casting: {
        type: String,
        required: true
    },

    Budget: {
        type: String,
        required: true
    },

    Genre: {
        type: String,
        enum: ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Other'],
        required: true
    },

    Script: {
        type: String,
    },

    Summary: {
        type: String,
    }

});

const uploadFilmModel = mongoose.model('UploadFilm', uploadFilmSchema);
module.exports = uploadFilmModel;