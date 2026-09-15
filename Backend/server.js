require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/db/db');

const PORT = process.env.PORT || 3000;

connectDB();

app.listen(PORT, () => {
    console.log(`[FilmyAI Backend] Server running on http://localhost:${PORT}`);
    console.log(`[FilmyAI Backend] Health check: http://localhost:${PORT}/health`);
});