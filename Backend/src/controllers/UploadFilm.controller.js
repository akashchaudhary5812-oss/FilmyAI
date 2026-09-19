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
 * Handles film registration and video/banner/cast ingestion via AWS S3 / Local Storage / Direct URL.
 * Uploads video and reference images directly to S3 (or organizes locally),
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
            uploadFilm: uploadFilmUrl,
            bannerUrl,
            castMembers: rawCastMembers
        } = req.body || {};

        if (!FilmName || !DirectorName || !ProductionHouses || !Casting || !Budget || !Genre) {
            return res.status(400).json({ status: false, message: 'Missing required film metadata' });
        }

        const filmObjectId = new mongoose.Types.ObjectId();

        // -------------------------------------------------------------
        // 1. Video Processing & Storage (uploadFilm)
        // -------------------------------------------------------------
        let filmMediaUrl = null;
        let storageProvider = 'LOCAL_STORAGE';
        let s3Bucket = null;
        let s3Key = null;
        let s3ObjectUrl = null;
        let originalFileName = null;
        let fileSize = 0;
        let mimeType = null;
        let localVideoPath = null;

        const videoFile = req.file || (req.files && req.files['uploadFilm'] ? req.files['uploadFilm'][0] : null);

        if (videoFile) {
            localVideoPath = videoFile.path;
            originalFileName = videoFile.originalname;
            fileSize = videoFile.size;
            mimeType = videoFile.mimetype;

            const ext = path.extname(originalFileName).toLowerCase();
            const safeBase = path.basename(originalFileName, ext).replace(/[^a-z0-9-_]/gi, '_');
            s3Key = `films/${filmObjectId}/original/${safeBase}_${Date.now()}${ext}`;

            try {
                console.log(`[UploadFilm] Uploading film video to AWS S3: ${s3Key} (${(fileSize / (1024 * 1024)).toFixed(2)} MB)`);
                
                const s3Result = await s3Service.uploadLocalFile({
                    filePath: localVideoPath,
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

                console.log(`[UploadFilm] ✅ S3 video upload verified: ${s3ObjectUrl}`);
            } catch (s3Err) {
                console.warn(`[UploadFilm] S3 upload skipped/failed (${s3Err.message}). Using local video storage path.`);
                storageProvider = 'LOCAL_STORAGE';
                filmMediaUrl = `/uploads/videos/${path.basename(localVideoPath)}`;
            }
        } else {
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

        // -------------------------------------------------------------
        // 2. Banner Image Processing & Storage (bannerImage)
        // -------------------------------------------------------------
        let bannerImageUrl = null;
        let localBannerPath = null;
        const bannerFile = req.files && req.files['bannerImage'] ? req.files['bannerImage'][0] : null;

        if (bannerFile) {
            localBannerPath = bannerFile.path;
            const ext = path.extname(bannerFile.originalname).toLowerCase();
            const safeBase = path.basename(bannerFile.originalname, ext).replace(/[^a-z0-9-_]/gi, '_');
            const bannerS3Key = `films/${filmObjectId}/banner/${safeBase}_${Date.now()}${ext}`;

            try {
                const s3BannerResult = await s3Service.uploadLocalFile({
                    filePath: localBannerPath,
                    s3Key: bannerS3Key,
                    mimeType: bannerFile.mimetype,
                    fileSize: bannerFile.size,
                    metadata: { filmId: filmObjectId.toString(), type: 'banner' }
                });
                bannerImageUrl = s3BannerResult.presignedUrl || s3BannerResult.s3ObjectUrl;
            } catch (s3Err) {
                bannerImageUrl = `/uploads/banners/${path.basename(localBannerPath)}`;
            }
        } else if (bannerUrl && isValidHttpUrl(bannerUrl.trim())) {
            bannerImageUrl = bannerUrl.trim();
        } else if (req.body.bannerImage && isValidHttpUrl(req.body.bannerImage.trim())) {
            bannerImageUrl = req.body.bannerImage.trim();
        }

        // -------------------------------------------------------------
        // 3. Multiple Cast Members & Reference Images Processing
        // -------------------------------------------------------------
        const castFiles = (req.files && (req.files['CastImage'] || req.files['castImages'] || req.files['castImage'])) || [];
        
        let parsedCastMetadata = [];
        if (rawCastMembers) {
            try {
                parsedCastMetadata = typeof rawCastMembers === 'string' ? JSON.parse(rawCastMembers) : rawCastMembers;
            } catch (e) {
                console.warn('[UploadFilm] Could not parse castMembers JSON:', e.message);
            }
        }

        // Fallback: If no structured castMembers JSON, split comma-separated Casting string
        if (!Array.isArray(parsedCastMetadata) || parsedCastMetadata.length === 0) {
            const castNames = String(Casting).split(/[,;|]/).map(s => s.trim()).filter(Boolean);
            parsedCastMetadata = castNames.map((name, idx) => ({
                actorName: name,
                characterName: null,
                imageIndex: idx
            }));
        }

        const normalizedCastMembers = [];
        let primaryCastImageUrl = null;

        for (let i = 0; i < parsedCastMetadata.length; i++) {
            const memberMeta = parsedCastMetadata[i];
            const actorName = (memberMeta.actorName || memberMeta.name || `Actor ${i + 1}`).trim();
            const characterName = memberMeta.characterName ? memberMeta.characterName.trim() : null;
            
            // Check matching file by imageIndex or array position
            const fileIndex = memberMeta.imageIndex !== undefined ? Number(memberMeta.imageIndex) : i;
            const matchedFile = (fileIndex >= 0 && fileIndex < castFiles.length) ? castFiles[fileIndex] : castFiles[i];

            let castImageUrl = memberMeta.imageUrl || null;
            let localActorImagePath = null;
            let castStorageKey = null;

            if (matchedFile) {
                localActorImagePath = matchedFile.path;
                const ext = path.extname(matchedFile.originalname).toLowerCase();
                const safeActorBase = actorName.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
                castStorageKey = `films/${filmObjectId}/cast/${safeActorBase}_${Date.now()}${ext}`;

                try {
                    const s3CastResult = await s3Service.uploadLocalFile({
                        filePath: localActorImagePath,
                        s3Key: castStorageKey,
                        mimeType: matchedFile.mimetype,
                        fileSize: matchedFile.size,
                        metadata: {
                            filmId: filmObjectId.toString(),
                            actorName: actorName,
                            type: 'cast_reference'
                        }
                    });
                    castImageUrl = s3CastResult.presignedUrl || s3CastResult.s3ObjectUrl;
                } catch (s3Err) {
                    castImageUrl = `/uploads/cast/${path.basename(localActorImagePath)}`;
                }
            }

            if (!primaryCastImageUrl && castImageUrl) {
                primaryCastImageUrl = castImageUrl;
            }

            normalizedCastMembers.push({
                actorName,
                characterName,
                imageUrl: castImageUrl || '',
                localImagePath: localActorImagePath,
                imageId: matchedFile ? path.basename(matchedFile.path) : null,
                storageKey: castStorageKey
            });
        }

        // Normalize ProductionHouses into an array for MongoDB schema
        const parsedProdHouses = Array.isArray(ProductionHouses)
            ? ProductionHouses
            : String(ProductionHouses).split(',').map(s => s.trim()).filter(Boolean);

        const newFilmData = await new UploadFilmModel({
            _id: filmObjectId,
            uploadFilm: filmMediaUrl,
            bannerImage: bannerImageUrl,
            FilmName: FilmName.trim(),
            DirectorName: DirectorName.trim(),
            ProductionHouses: parsedProdHouses.length > 0 ? parsedProdHouses : [ProductionHouses],
            Casting: Casting.trim(),
            CastImage: primaryCastImageUrl || bannerImageUrl || null,
            castMembers: normalizedCastMembers.map(c => ({
                actorName: c.actorName,
                characterName: c.characterName,
                imageUrl: c.imageUrl,
                imageId: c.imageId,
                storageKey: c.storageKey
            })),
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

        // -------------------------------------------------------------
        // 4. Trigger Unified Background ML & RAG Pipeline
        // -------------------------------------------------------------
        mlPipelineService.triggerPipeline(newFilmData, { 
            localFilePath: localVideoPath,
            bannerImageUrl: bannerImageUrl,
            localBannerPath: localBannerPath,
            castMembers: normalizedCastMembers
        }).catch((err) => {
            console.error('[UploadFilm] Background ML pipeline failed to start:', err);
        });

        return res.status(201).json({ 
            status: true, 
            message: videoFile ? 'Film uploaded and analysis pipeline started successfully' : 'Film registered and analysis pipeline started successfully', 
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

