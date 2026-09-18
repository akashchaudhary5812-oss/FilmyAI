const UploadFilmModel = require('../models/UploadFilm.model');
const imagekit = require('../services/imagekit.service');
const mlPipelineService = require('../services/mlPipeline.service');
const path = require('path');
const fs = require('fs');

function isValidHttpUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

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

        // Mode 1: Local File Upload (via Multer diskStorage)
        if (req.file) {
            const host = req.get('host') || 'localhost:3000';
            const protocol = req.protocol || 'http';
            const localStaticUrl = `${protocol}://${host}/uploads/videos/${req.file.filename}`;
            
            // ImageKit free tier caps single file uploads at 100MB (104,857,600 bytes).
            // For files under 95MB, try ImageKit; if > 95MB or if ImageKit fails, smoothly use local server storage.
            const IMAGEKIT_SAFE_LIMIT = 95 * 1024 * 1024;
            
            if (req.file.size < IMAGEKIT_SAFE_LIMIT) {
                try {
                    const fileBuffer = fs.readFileSync(req.file.path);
                    const extension = path.extname(req.file.originalname).toLowerCase();
                    const fileName = `${FilmName.replace(/[^a-z0-9-_]/gi, '_')}_${Date.now()}${extension}`;
                    filmMediaUrl = await imagekit.uploadFile(fileBuffer, fileName);
                } catch (ikErr) {
                    console.warn('[UploadFilm] ImageKit upload bypassed or failed, using local server storage:', ikErr.message);
                    filmMediaUrl = localStaticUrl;
                }
            } else {
                console.log(`[UploadFilm] Video file (${(req.file.size / (1024 * 1024)).toFixed(1)} MB) stored directly on local high-performance server storage: ${localStaticUrl}`);
                filmMediaUrl = localStaticUrl;
            }
        } 
        // Mode 2: Direct Video URL (Public or Authorized Video URL)
        else {
            const candidateUrl = videoUrl || uploadFilmUrl;
            if (!candidateUrl || typeof candidateUrl !== 'string' || !isValidHttpUrl(candidateUrl.trim())) {
                return res.status(400).json({ 
                    status: false, 
                    message: 'A valid film video file or a public/authorized video URL (http/https) is required.' 
                });
            }
            filmMediaUrl = candidateUrl.trim();
        }

        // Normalize ProductionHouses into an array for MongoDB schema
        const parsedProdHouses = Array.isArray(ProductionHouses)
            ? ProductionHouses
            : String(ProductionHouses).split(',').map(s => s.trim()).filter(Boolean);

        const newFilmData = await new UploadFilmModel({
            uploadFilm: filmMediaUrl,
            FilmName: FilmName.trim(),
            DirectorName: DirectorName.trim(),
            ProductionHouses: parsedProdHouses.length > 0 ? parsedProdHouses : [ProductionHouses],
            Casting: Casting.trim(),
            Budget: String(Budget).trim(),
            Genre,
            Script: Script ? Script.trim() : undefined,
            Summary: Summary ? Summary.trim() : undefined,
            processingStatus: 'PENDING',
            analysisProgress: 0,
            ragReady: false
        }).save();

        // Trigger real background ML & RAG pipeline (as per ApiDesign)
        mlPipelineService.triggerPipeline(newFilmData).catch((err) => {
            console.error('[UploadFilm] Background ML pipeline failed to start:', err);
        });

        return res.status(201).json({ 
            status: true, 
            message: req.file ? 'Film uploaded and analysis started successfully' : 'Film video URL registered and analysis started successfully', 
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
