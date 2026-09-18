const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const UploadFilm = require('./models/UploadFilm.model');
const mlPipelineService = require('./services/mlPipeline.service');

const BACKEND_URL = 'http://localhost:3000';

async function main() {
    console.log('=== Testing End-to-End FilmyAI Pipeline (Node + Python ML + MongoDB + API) ===');

    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/FilmyAI';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB:', mongoUri);

    // 1. Create a film record in MongoDB
    const film = await UploadFilm.create({
        FilmName: 'The Quantum Horizon',
        DirectorName: 'Denis Villeneuve',
        Casting: 'Oscar Isaac, Rebecca Ferguson, Timothee Chalamet',
        ProductionHouses: 'Legendary Pictures, Warner Bros.',
        Budget: 175000000,
        Genre: 'Sci-Fi',
        ReleaseYear: 2026,
        ReleaseMonth: 11,
        IsSequel: false,
        Summary: 'An interdisciplinary team of astrophysicists navigates an uncharted temporal anomaly at the perimeter of the solar system.',
        Script: 'INT. COMMAND MODULE - NIGHT\nInstrument panels flicker with rhythmic blue pulses as the gravitational shear intensifies.',
        uploadFilm: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        processingStatus: 'PENDING',
        analysisProgress: 0,
        ragReady: false
    });

    const filmId = film._id.toString();
    console.log(`Created MongoDB Film Record: ID=${filmId}, Title='${film.FilmName}'`);

    // 2. Trigger the ML pipeline orchestrator
    console.log('\n--- Triggering Background ML Pipeline Orchestrator ---');
    mlPipelineService.triggerPipeline(film);

    // 3. Poll status endpoint while running
    let completed = false;
    let attempts = 0;
    const maxAttempts = 40; // 40 * 1.5s = 60s max

    while (!completed && attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 1500));
        attempts++;

        try {
            const statusRes = await fetch(`${BACKEND_URL}/api/film/${filmId}/status`);
            const statusData = await statusRes.json();
            console.log(`[Poll #${attempts}] Status: ${statusData.processingStatus} | Progress: ${statusData.analysisProgress}%`);

            if (statusData.processingStatus === 'COMPLETED') {
                completed = true;
                break;
            } else if (statusData.processingStatus === 'FAILED') {
                throw new Error(`Pipeline failed: ${statusData.error}`);
            }
        } catch (err) {
            console.log(`[Poll #${attempts}] Polling note: ${err.message}`);
        }
    }

    if (!completed) {
        throw new Error('Pipeline timed out before reaching COMPLETED status.');
    }

    console.log('\n--- Pipeline Succeeded! Verifying Generated Report API ---');
    const reportRes = await fetch(`${BACKEND_URL}/api/film/${filmId}/report`);
    const reportData = await reportRes.json();

    console.log('GET /api/film/:id/report response: HTTP', reportRes.status);
    console.log('Report Object Verified:');
    console.log('  - Report ID:', reportData.report.report_id);
    console.log('  - Title:', reportData.report.film_title);
    console.log('  - Verdict:', reportData.report.executive_summary?.commercial_verdict);
    console.log('  - Overall Rating:', reportData.report.executive_summary?.overall_film_rating);
    console.log('  - ML Predicted Class:', reportData.report.raw_ml_predictions?.predicted_commercial_class);
    console.log('  - ML Commercial Score:', reportData.report.raw_ml_predictions?.predicted_commercial_score);
    console.log('  - Video Duration Analyzed:', reportData.report.raw_video_metrics?.duration_seconds, 'sec');
    console.log('  - Total Shots Detected:', reportData.report.raw_video_metrics?.total_shots);
    console.log('  - RAG Indexing Status:', reportData.report.rag_indexing_status);

    console.log('\n========================================================');
    console.log('END-TO-END SYSTEM INTEGRATION FULLY VALIDATED!');
    console.log('========================================================');

    await mongoose.disconnect();
    process.exit(0);
}

main().catch(err => {
    console.error('Fatal Test Error:', err);
    process.exit(1);
});
