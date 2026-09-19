const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const UploadFilmModel = require('../models/UploadFilm.model');
const s3Service = require('../services/s3.service');
const mlPipelineService = require('../services/mlPipeline.service');

function isValidHttpUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

/**
 * Handles film registration and video ingestion via AWS S3 / Direct URL.
 * Uploads local Multer disk file directly to S3 with streaming and multipart support,
 * validates integrity, saves document in MongoDB, and triggers background ML pipeline.
 */
async function uploadFilm(req, res) {
    try {
        const { 
            FilmName, 
            DirectorName, 
            ProductionHouses, 
            Casting, 
            Budget, 
            Genre, 
            Script, 
            Summary, 
            videoUrl, 
            uploadFilm: uploadFilmUrl 
        } = req.body || {};

        if (!FilmName || !DirectorName || !ProductionHouses || !Casting || !Budget || !Genre) {
            return res.status(400).json({ status: false, message: 'Missing required film metadata' });
        }

        let filmMediaUrl = null;
        let storageProvider = 'LOCAL_STORAGE';
        let s3Bucket = null;
        let s3Key = null;
        let s3ObjectUrl = null;
        let originalFileName = null;
        let fileSize = 0;
        let mimeType = null;
        let localFilePath = null;

        const filmObjectId = new mongoose.Types.ObjectId();

        // -------------------------------------------------------------
        // Mode 1: Local File Upload (via Multer diskStorage -> AWS S3)
        // -------------------------------------------------------------
        if (req.file) {
            localFilePath = req.file.path;
            originalFileName = req.file.originalname;
            fileSize = req.file.size;
            mimeType = req.file.mimetype;

            const ext = path.extname(originalFileName).toLowerCase();
            const safeBase = path.basename(originalFileName, ext).replace(/[^a-z0-9-_]/gi, '_');
            s3Key = `films/${filmObjectId}/original/${safeBase}_${Date.now()}${ext}`;

            try {
                console.log(`[UploadFilm] Uploading film to AWS S3: ${s3Key} (${(fileSize / (1024 * 1024)).toFixed(2)} MB)`);
                
                const s3Result = await s3Service.uploadLocalFile({
                    filePath: localFilePath,
                    s3Key: s3Key,
                    mimeType: mimeType,
                    fileSize: fileSize,
                    metadata: {
                        filmTitle: FilmName.trim(),
                        director: DirectorName.trim(),
                        filmId: filmObjectId.toString(),
                        originalFileName: originalFileName,
                    }
                });

                storageProvider = 'AWS_S3';
                s3Bucket = s3Result.s3Bucket;
                s3Key = s3Result.s3Key;
                s3ObjectUrl = s3Result.s3ObjectUrl;
                filmMediaUrl = s3Result.presignedUrl || s3Result.s3ObjectUrl;

                console.log(`[UploadFilm] ✅ S3 upload verified: ${s3ObjectUrl}`);
            } catch (s3Err) {
                console.error('[UploadFilm] ❌ AWS S3 Upload Failed:', s3Err);
                return res.status(500).json({
                    status: false,
                    message: `AWS S3 Storage Upload Failed: ${s3Err.message || 'S3 error'}`
                });
            }
        } 
        // -------------------------------------------------------------
        // Mode 2: Direct Video URL (Public or Authorized Video URL)
        // -------------------------------------------------------------
        else {
            const candidateUrl = videoUrl || uploadFilmUrl;
            if (!candidateUrl || typeof candidateUrl !== 'string' || !isValidHttpUrl(candidateUrl.trim())) {
                return res.status(400).json({ 
                    status: false, 
                    message: 'A valid film video file or a public/authorized video URL (http/https) is required.' 
                });
            }
            filmMediaUrl = candidateUrl.trim();
            storageProvider = 'EXTERNAL_URL';
            originalFileName = path.basename(candidateUrl.split('?')[0]) || 'video.mp4';
        }

        // Normalize ProductionHouses into an array for MongoDB schema
        const parsedProdHouses = Array.isArray(ProductionHouses)
            ? ProductionHouses
            : String(ProductionHouses).split(',').map(s => s.trim()).filter(Boolean);

        const newFilmData = await new UploadFilmModel({
            _id: filmObjectId,
            uploadFilm: filmMediaUrl,
            FilmName: FilmName.trim(),
            DirectorName: DirectorName.trim(),
            ProductionHouses: parsedProdHouses.length > 0 ? parsedProdHouses : [ProductionHouses],
            Casting: Casting.trim(),
            Budget: String(Budget).trim(),
            Genre,
            Script: Script ? Script.trim() : undefined,
            Summary: Summary ? Summary.trim() : undefined,
            storageProvider,
            s3Bucket,
            s3Key,
            s3ObjectUrl,
            originalFileName,
            fileSize,
            mimeType,
            processingStatus: 'PENDING',
            analysisProgress: 0,
            ragReady: false
        }).save();

        // Trigger real background ML & RAG pipeline
        mlPipelineService.triggerPipeline(newFilmData, { localFilePath }).catch((err) => {
            console.error('[UploadFilm] Background ML pipeline failed to start:', err);
        });

        return res.status(201).json({ 
            status: true, 
            message: req.file ? 'Film uploaded to AWS S3 and analysis started successfully' : 'Film video URL registered and analysis started successfully', 
            data: newFilmData 
        });
    } catch (error) {
        console.error('[UploadFilm] Error registering film:', error);
        return res.status(500).json({ status: false, message: error.message || 'Unable to register film' });
    }
}

module.exports = {
    uploadFilm,
};
