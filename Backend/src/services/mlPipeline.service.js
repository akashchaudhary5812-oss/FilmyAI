const UploadFilmModel = require('../models/UploadFilm.model');
const mlRemoteService = require('./mlRemote.service');

function isValidHttpUrl(string) {
    if (!string || typeof string !== 'string') return false;
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

class MLPipelineService {
    /**
     * Executes the multimodal ML pipeline remotely in the background for an uploaded/registered film document.
     * Connects to the Kaggle GPU Gradio service, updates MongoDB with stage progression,
     * timings, and saves the final validated report.
     * 
     * @param {Object} filmDoc - UploadFilm Mongoose document
     * @param {Object} [options] - Execution options
     */
    async triggerPipeline(filmDoc, options = {}) {
        if (!filmDoc || !filmDoc._id) return;

        const filmId = filmDoc._id.toString();
        console.log(`[MLPipelineService] Starting remote analysis pipeline for Film ID: ${filmId} ('${filmDoc.FilmName}')`);

        // Prefer permanent S3 object URL or valid HTTP/HTTPS URL
        // Do NOT pass local filesystem paths to remote Kaggle GPU
        let videoTarget = null;
        if (filmDoc.s3ObjectUrl && isValidHttpUrl(filmDoc.s3ObjectUrl)) {
            videoTarget = filmDoc.s3ObjectUrl;
        } else if (filmDoc.uploadFilm && isValidHttpUrl(filmDoc.uploadFilm)) {
            videoTarget = filmDoc.uploadFilm;
        } else if (options.videoUrl && isValidHttpUrl(options.videoUrl)) {
            videoTarget = options.videoUrl;
        } else if (filmDoc.uploadFilm) {
            videoTarget = filmDoc.uploadFilm;
        }

        // Prepare banner URL
        const bannerUrl = (filmDoc.bannerImage && isValidHttpUrl(filmDoc.bannerImage)) 
            ? filmDoc.bannerImage 
            : (options.bannerImageUrl && isValidHttpUrl(options.bannerImageUrl) ? options.bannerImageUrl : null);

        // Prepare structured cast member metadata
        const castMembersPayload = (options.castMembers || filmDoc.castMembers || []).map(c => ({
            actor_name: c.actorName,
            character_name: c.characterName || null,
            image_url: (c.imageUrl && isValidHttpUrl(c.imageUrl)) ? c.imageUrl : (c.imageUrl || null),
            image_path: (c.imageUrl && isValidHttpUrl(c.imageUrl)) ? c.imageUrl : null
        }));

        // Build normalized payload for remote runner
        const payload = {
            film_id: filmId,
            FilmName: filmDoc.FilmName,
            DirectorName: filmDoc.DirectorName,
            Casting: filmDoc.Casting,
            CastImage: filmDoc.CastImage || null,
            banner_image: bannerUrl,
            bannerImage: bannerUrl,
            cast_members: castMembersPayload,
            castMembers: castMembersPayload,
            ProductionHouses: Array.isArray(filmDoc.ProductionHouses) 
                ? filmDoc.ProductionHouses.join(', ') 
                : filmDoc.ProductionHouses,
            Budget: filmDoc.Budget,
            Genre: filmDoc.Genre,
            uploadFilm: videoTarget,
            video_path: videoTarget,
            Script: filmDoc.Script || '',
            Summary: filmDoc.Summary || '',
            generate_pdf: true
        };

        // Asynchronous execution without blocking the caller
        (async () => {
            let stageTimers = [];

            try {
                // Stage 1: Starting video analysis
                await UploadFilmModel.findByIdAndUpdate(filmId, {
                    processingStatus: 'ANALYZING_VIDEO',
                    analysisProgress: 15,
                    processingError: null
                });

                // Simulated granular progress tracking for responsive frontend polling
                stageTimers.push(setTimeout(async () => {
                    try {
                        const current = await UploadFilmModel.findById(filmId).select('processingStatus');
                        if (current && current.processingStatus === 'ANALYZING_VIDEO') {
                            await UploadFilmModel.findByIdAndUpdate(filmId, {
                                processingStatus: 'ANALYZING_COMMERCIAL',
                                analysisProgress: 50
                            });
                        }
                    } catch (_) {}
                }, 4000));

                stageTimers.push(setTimeout(async () => {
                    try {
                        const current = await UploadFilmModel.findById(filmId).select('processingStatus');
                        if (current && (current.processingStatus === 'ANALYZING_VIDEO' || current.processingStatus === 'ANALYZING_COMMERCIAL')) {
                            await UploadFilmModel.findByIdAndUpdate(filmId, {
                                processingStatus: 'GENERATING_REPORT',
                                analysisProgress: 75
                            });
                        }
                    } catch (_) {}
                }, 10000));

                stageTimers.push(setTimeout(async () => {
                    try {
                        const current = await UploadFilmModel.findById(filmId).select('processingStatus');
                        if (current && current.processingStatus !== 'COMPLETED' && current.processingStatus !== 'FAILED') {
                            await UploadFilmModel.findByIdAndUpdate(filmId, {
                                processingStatus: 'INDEXING_RAG',
                                analysisProgress: 90
                            });
                        }
                    } catch (_) {}
                }, 18000));

                // Execute remote analysis on Kaggle GPU Gradio service
                const parsedReport = await mlRemoteService.executeRemoteAnalysis(payload);

                // Clear stage timers once remote execution finishes
                stageTimers.forEach(t => clearTimeout(t));

                // Extract ratings and timings
                const modelRating =
                    parsedReport.executive_summary?.overall_film_rating ??
                    parsedReport.raw_ml_predictions?.predicted_commercial_score ??
                    parsedReport.rating ??
                    null;

                const timings = parsedReport.timings || {};

                await UploadFilmModel.findByIdAndUpdate(filmId, {
                    processingStatus: 'COMPLETED',
                    analysisProgress: 100,
                    ragReady: true,
                    report: parsedReport,
                    rating: typeof modelRating === 'number' ? Number(modelRating.toFixed(1)) : null,
                    timings: timings
                });

                console.log(`[MLPipelineService] Successfully completed and saved remote report for Film ID: ${filmId} (Rating: ${modelRating})`);

            } catch (err) {
                stageTimers.forEach(t => clearTimeout(t));
                console.error(`[MLPipelineService] Remote ML pipeline execution error for Film ID: ${filmId}:`, err.message);

                await UploadFilmModel.findByIdAndUpdate(filmId, {
                    processingStatus: 'FAILED',
                    processingError: err.message
                });
            }
        })();
    }
}

module.exports = new MLPipelineService();
