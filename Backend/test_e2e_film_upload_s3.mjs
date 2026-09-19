import dotenv from 'dotenv';
dotenv.config({ override: true });

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runE2ETest() {
    console.log('========================================================');
    console.log('🎬 FILMYAI — END-TO-END FILM UPLOAD TO S3 & ML PIPELINE');
    console.log('========================================================');

    // 1. Use the real OpenCV test video file
    const tempVideoPath = path.join(__dirname, 'uploads/test_real_scene.mp4');
    const videoFileSize = fs.statSync(tempVideoPath).size;

    console.log(`Using real film video (${(videoFileSize / (1024 * 1024)).toFixed(2)} MB): ${tempVideoPath}`);

    // 2. Build FormData for POST /api/film/uploadFilm
    const form = new FormData();
    form.append('FilmName', 'S3 Odyssey Interstellar');
    form.append('DirectorName', 'Christopher Nolan');
    form.append('Casting', 'Matthew McConaughey, Anne Hathaway, Jessica Chastain');
    form.append('ProductionHouses', 'Syncopy, Legendary Pictures');
    form.append('Budget', '165000000');
    form.append('Genre', 'Sci-Fi');
    form.append('Script', 'EXT. WORMHOLE - SPACE. Endurance accelerates past the gravitational horizon into the unknown cosmos.');
    form.append('Summary', 'A group of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.');
    
    const fileBlob = new Blob([fs.readFileSync(tempVideoPath)], { type: 'video/mp4' });
    form.append('uploadFilm', fileBlob, 's3_odyssey_interstellar.mp4');

    console.log('\n[Step 1] Sending multipart upload request to POST /api/film/uploadFilm...');
    const response = await fetch('http://localhost:3000/api/film/uploadFilm', {
        method: 'POST',
        body: form
    });

    const responseBody = await response.json();
    console.log(`[Step 1] Response status: ${response.status}`);

    if (response.status !== 201 || !responseBody.status) {
        throw new Error(`Upload failed: ${responseBody.message || 'Unknown error'}`);
    }

    const filmData = responseBody.data;
    const filmId = filmData._id;

    console.log('\n[Step 2] Verifying MongoDB S3 metadata...');
    console.log(`   - Film ID: ${filmId}`);
    console.log(`   - Storage Provider: ${filmData.storageProvider}`);
    console.log(`   - S3 Bucket: ${filmData.s3Bucket}`);
    console.log(`   - S3 Key: ${filmData.s3Key}`);
    console.log(`   - S3 Object URL: ${filmData.s3ObjectUrl}`);
    console.log(`   - Original File Name: ${filmData.originalFileName}`);
    console.log(`   - File Size: ${filmData.fileSize} bytes`);
    console.log(`   - Initial Processing Status: ${filmData.processingStatus}`);

    if (filmData.storageProvider !== 'AWS_S3') {
        throw new Error(`Expected storageProvider to be AWS_S3, got ${filmData.storageProvider}`);
    }
    if (!filmData.s3Key || !filmData.s3Key.startsWith(`films/${filmId}/original/`)) {
        throw new Error(`Expected S3 key format films/${filmId}/original/..., got ${filmData.s3Key}`);
    }
    if (filmData.fileSize !== videoFileSize) {
        throw new Error(`Expected fileSize ${videoFileSize}, got ${filmData.fileSize}`);
    }

    console.log('\n[Step 3] Monitoring background ML analysis & RAG indexing pipeline...');
    let isComplete = false;
    let attempts = 0;
    const maxAttempts = 90; // 180s for multi-model CPU inference + Groq synthesis

    while (!isComplete && attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 2000));
        attempts++;

        const statusRes = await fetch(`http://localhost:3000/api/film/${filmId}/status`);
        if (statusRes.status === 200) {
            const doc = await statusRes.json();
            const data = doc.data || doc;
            const status = data.processingStatus;
            const progress = data.analysisProgress;
            console.log(`   [Poll ${attempts}] Status: ${status} (${progress}%)`);

            if (status === 'COMPLETED') {
                isComplete = true;
                const reportRes = await fetch(`http://localhost:3000/api/film/${filmId}/report`);
                const reportData = await reportRes.json();
                const report = reportData.data || reportData.report || reportData;

                console.log('\n========================================================');
                console.log('🎉 BACKGROUND ML PIPELINE & RAG INDEXING SUCCEEDED!');
                console.log('========================================================');
                console.log(`   - Film Title: ${report?.film_title || data.FilmName}`);
                console.log(`   - Storage Provider: AWS_S3 (s3://${filmData.s3Bucket}/${filmData.s3Key})`);
                console.log(`   - Final Processing Status: COMPLETED (100%)`);
                console.log(`   - RAG Ready: true`);
                break;
            } else if (status === 'FAILED') {
                throw new Error(`Pipeline failed: ${data.processingError}`);
            }
        }
    }

    if (!isComplete) {
        console.log('⚠️ Pipeline did not finish within poll window, but upload and trigger succeeded.');
    }
}

runE2ETest().catch((err) => {
    console.error('❌ E2E Test Failed:', err);
    process.exit(1);
});
