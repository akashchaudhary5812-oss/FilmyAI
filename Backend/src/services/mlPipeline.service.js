const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const UploadFilmModel = require('../models/UploadFilm.model');

// Root of the workspace
const WORKSPACE_ROOT = path.resolve(__dirname, '../../../');

class MLPipelineService {
    /**
     * Executes the multimodal ML pipeline in the background for an uploaded/registered film document.
     * Updates MongoDB with real stage progression, timings, and saves the final validated report.
     * 
     * @param {Object} filmDoc - UploadFilm Mongoose document
     * @param {Object} [options] - Execution options
     * @param {string} [options.localFilePath] - Optional local file path for direct filesystem ML_VIDEO analysis
     */
    async triggerPipeline(filmDoc, options = {}) {
        if (!filmDoc || !filmDoc._id) return;

        const filmId = filmDoc._id.toString();
        console.log(`[MLPipelineService] Starting asynchronous analysis pipeline for Film ID: ${filmId} ('${filmDoc.FilmName}')`);

        const localFilePath = options.localFilePath;
        const videoTarget = localFilePath && fs.existsSync(localFilePath) ? localFilePath : filmDoc.uploadFilm;

        try {
            // Update status to starting
            await UploadFilmModel.findByIdAndUpdate(filmId, {
                processingStatus: 'ANALYZING_VIDEO',
                analysisProgress: 10,
                processingError: null
            });

            // Prepare payload
            const payload = {
                film_id: filmId,
                FilmName: filmDoc.FilmName,
                DirectorName: filmDoc.DirectorName,
                Casting: filmDoc.Casting,
                ProductionHouses: Array.isArray(filmDoc.ProductionHouses) 
                    ? filmDoc.ProductionHouses.join(', ') 
                    : filmDoc.ProductionHouses,
                Budget: filmDoc.Budget,
                Genre: filmDoc.Genre,
                uploadFilm: filmDoc.uploadFilm,
                video_path: videoTarget,
                Script: filmDoc.Script || '',
                Summary: filmDoc.Summary || '',
                generate_pdf: true
            };

            // Write payload to a temporary JSON file to avoid shell argument length limits on Windows
            const tempDir = path.join(__dirname, '../../uploads/temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            const payloadFile = path.join(tempDir, `payload_${filmId}.json`);
            fs.writeFileSync(payloadFile, JSON.stringify(payload, null, 2), 'utf-8');

            // Launch Python pipeline runner in unbuffered mode for real-time progress streaming
            const pythonExecutable = process.env.PYTHON_PATH || 'python';
            const child = spawn(
                pythonExecutable,
                ['-u', '-m', 'LLM_FINAL_REPORT.runner', '--json-input', payloadFile],
                {
                    cwd: WORKSPACE_ROOT,
                    env: {
                        ...process.env,
                        PYTHONPATH: WORKSPACE_ROOT,
                        PYTHONUNBUFFERED: '1'
                    },
                    shell: false
                }
            );

            let stdoutAccumulator = '';
            let stderrAccumulator = '';
            let isCapturingJson = false;
            let reportJsonStr = '';

            child.stdout.on('data', async (chunk) => {
                const text = chunk.toString();
                stdoutAccumulator += text;
                console.log(`[MLPipeline:Python] ${text.trim()}`);

                const lines = text.split('\n');
                for (const line of lines) {
                    const trimmed = line.trim();

                    if (trimmed.startsWith('[STAGE:ANALYZING_VIDEO')) {
                        await UploadFilmModel.findByIdAndUpdate(filmId, {
                            processingStatus: 'ANALYZING_VIDEO',
                            analysisProgress: 25
                        });
                    } else if (trimmed.startsWith('[STAGE:ANALYZING_COMMERCIAL')) {
                        await UploadFilmModel.findByIdAndUpdate(filmId, {
                            processingStatus: 'ANALYZING_COMMERCIAL',
                            analysisProgress: 50
                        });
                    } else if (trimmed.startsWith('[STAGE:GENERATING_REPORT')) {
                        await UploadFilmModel.findByIdAndUpdate(filmId, {
                            processingStatus: 'GENERATING_REPORT',
                            analysisProgress: 75
                        });
                    } else if (trimmed.startsWith('[STAGE:INDEXING_RAG')) {
                        await UploadFilmModel.findByIdAndUpdate(filmId, {
                            processingStatus: 'INDEXING_RAG',
                            analysisProgress: 90
                        });
                    }

                    if (trimmed === '[REPORT_JSON_START]') {
                        isCapturingJson = true;
                        reportJsonStr = '';
                        continue;
                    }
                    if (trimmed === '[REPORT_JSON_END]') {
                        isCapturingJson = false;
                        continue;
                    }

                    if (isCapturingJson) {
                        reportJsonStr += line + '\n';
                    }
                }
            });

            child.stderr.on('data', (chunk) => {
                const text = chunk.toString();
                stderrAccumulator += text;
                console.error(`[MLPipeline:Python:Err] ${text.trim()}`);
            });

            child.on('close', async (code) => {
                // Clean temp payload
                try {
                    if (fs.existsSync(payloadFile)) fs.unlinkSync(payloadFile);
                } catch (_) {}

                if (code === 0 && reportJsonStr.trim()) {
                    try {
                        const parsedReport = JSON.parse(reportJsonStr.trim());
                        await UploadFilmModel.findByIdAndUpdate(filmId, {
                            processingStatus: 'COMPLETED',
                            analysisProgress: 100,
                            ragReady: true,
                            report: parsedReport,
                            timings: parsedReport.timings || {}
                        });
                        console.log(`[MLPipelineService] Successfully completed and saved report for Film ID: ${filmId}`);
                    } catch (parseErr) {
                        console.error(`[MLPipelineService] JSON parsing error for report:`, parseErr);
                        await UploadFilmModel.findByIdAndUpdate(filmId, {
                            processingStatus: 'FAILED',
                            processingError: `Report parse error: ${parseErr.message}`
                        });
                    }
                } else {
                    console.error(`[MLPipelineService] Process exited with code ${code}. Error: ${stderrAccumulator}`);
                    await UploadFilmModel.findByIdAndUpdate(filmId, {
                        processingStatus: 'FAILED',
                        processingError: stderrAccumulator || `Pipeline exited with code ${code}`
                    });
                }
            });

            child.on('error', async (err) => {
                console.error(`[MLPipelineService] Failed to spawn Python pipeline process:`, err);
                await UploadFilmModel.findByIdAndUpdate(filmId, {
                    processingStatus: 'FAILED',
                    processingError: `Process error: ${err.message}`
                });
            });

        } catch (err) {
            console.error(`[MLPipelineService] Unexpected execution error for Film ID: ${filmId}:`, err);
            await UploadFilmModel.findByIdAndUpdate(filmId, {
                processingStatus: 'FAILED',
                processingError: err.message
            });
        }
    }
}

module.exports = new MLPipelineService();
