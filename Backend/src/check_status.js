const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
const UploadFilm = require('./models/UploadFilm.model');

async function check() {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/FilmyAI';
    await mongoose.connect(mongoUri);
    
    const films = await UploadFilm.find().sort({ createdAt: -1 }).limit(10);
    console.log('========================================================');
    console.log('FILMYAI: LIVE TASK STATUS & PROCESSING REPORT');
    console.log('========================================================');
    
    films.forEach((f, idx) => {
        console.log(`\n[#${idx + 1}] Film: "${f.FilmName}" (ID: ${f._id})`);
        console.log(`    Processing Status : ${f.processingStatus || 'UNKNOWN'}`);
        console.log(`    Progress          : ${f.analysisProgress || 0}%`);
        console.log(`    RAG Index Ready   : ${f.ragReady ? 'YES' : 'NO'}`);
        console.log(`    Report Generated  : ${f.report ? 'YES' : 'NO'}`);
        console.log(`    Video Source      : ${f.uploadFilm}`);
        console.log(`    Created At        : ${f.createdAt}`);
        console.log(`    Last Updated      : ${f.updatedAt}`);
        console.log(`    Processing Error  : ${f.processingError || 'None'}`);
        
        if (f.timings && Object.keys(f.timings).length > 0) {
            console.log(`    Stage Benchmarks  :`, JSON.stringify(f.timings, null, 2));
        }
        
        if (f.report) {
            console.log(`    Verdict           : ${f.report.executive_summary?.commercial_verdict || 'N/A'}`);
            console.log(`    Rating            : ${f.report.executive_summary?.overall_film_rating || 'N/A'}/10`);
            console.log(`    ML Class          : ${f.report.raw_ml_predictions?.predicted_commercial_class || 'N/A'}`);
            console.log(`    ML Score          : ${f.report.raw_ml_predictions?.predicted_commercial_score || 'N/A'}/9.0`);
        }
    });

    console.log('\n========================================================');
    await mongoose.disconnect();
}

check().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
