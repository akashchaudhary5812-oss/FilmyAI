const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
const UploadFilm = require('./models/UploadFilm.model');

async function syncCompletedReport() {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/FilmyAI';
    await mongoose.connect(mongoUri);

    const reportsDir = path.join(__dirname, '../../LLM_FINAL_REPORT/generated_reports');
    const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('_report.json') && f.startsWith('KGF_2'));
    
    if (files.length === 0) {
        console.log('No KGF 2 report file found.');
        await mongoose.disconnect();
        return;
    }

    // Sort to get newest
    files.sort();
    const newestFile = files[files.length - 1];
    const reportPath = path.join(reportsDir, newestFile);
    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

    const filmId = '6aad19e358af107b6b90ba83';
    await UploadFilm.findByIdAndUpdate(filmId, {
        processingStatus: 'COMPLETED',
        analysisProgress: 100,
        ragReady: true,
        report: reportData,
        timings: reportData.timings || {
            video_analysis_sec: 684.59,
            commercial_ml_sec: 5.07,
            report_generation_sec: 4.69,
            rag_indexing_sec: 9.25,
            total_execution_sec: 703.61
        }
    });

    console.log(`[Sync] Successfully synced completed KGF 2 report (${newestFile}) to MongoDB film ${filmId}!`);
    await mongoose.disconnect();
}

syncCompletedReport().catch(console.error);
