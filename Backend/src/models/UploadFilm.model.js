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
    },

    // ── Storage Provider & S3 Metadata ───────────────────────────────────
    storageProvider: {
        type: String,
        enum: ['AWS_S3', 'LOCAL_STORAGE', 'IMAGEKIT', 'EXTERNAL_URL'],
        default: 'LOCAL_STORAGE'
    },

    s3Bucket: {
        type: String,
        default: null
    },

    s3Key: {
        type: String,
        default: null
    },

    s3ObjectUrl: {
        type: String,
        default: null
    },

    originalFileName: {
        type: String,
        default: null
    },

    fileSize: {
        type: Number,
        default: 0
    },

    mimeType: {
        type: String,
        default: null
    },

    // ── Pipeline & Report State Tracking ─────────────────────────────────
    processingStatus: {
        type: String,
        enum: [
            'PENDING',
            'VALIDATING_MEDIA',
            'DOWNLOADING_VIDEO',
            'ANALYZING_VIDEO',
            'ANALYZING_COMMERCIAL',
            'GENERATING_REPORT',
            'INDEXING_RAG',
            'COMPLETED',
            'FAILED'
        ],
        default: 'PENDING'
    },

    analysisProgress: {
        type: Number,
        default: 0
    },

    ragReady: {
        type: Boolean,
        default: false
    },

    report: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },

    timings: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    processingError: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

const uploadFilmModel = mongoose.model('UploadFilm', uploadFilmSchema);
module.exports = uploadFilmModel;