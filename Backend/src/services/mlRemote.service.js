/**
 * ML Remote Service
 * Connects to the remote FilmyAI ML Pipeline (Gradio / GPU Runtime on Kaggle)
 * using @gradio/client.
 */

function isValidHttpUrl(string) {
    if (!string || typeof string !== 'string') return false;
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

class MLRemoteService {
    /**
     * Executes the remote multimodal analysis on Kaggle Gradio endpoint /analyze
     * 
     * @param {Object} payload - Film analysis request payload
     * @returns {Promise<Object>} - Parsed final report JSON
     */
    async executeRemoteAnalysis(payload) {
        const apiUrl = process.env.ML_VIDEO_API_URL;
        if (!apiUrl || !apiUrl.trim()) {
            throw new Error('ML_VIDEO_API_URL environment variable is not configured.');
        }

        console.log(`[MLRemoteService] Connecting to remote ML Gradio service at: ${apiUrl.trim().replace(/\/+$/, '')}`);

        // Dynamically import @gradio/client for CommonJS compatibility
        const { Client, handle_file } = await import('@gradio/client');

        let client;
        try {
            client = await Client.connect(apiUrl.trim());
        } catch (connErr) {
            throw new Error(`Failed to connect to remote ML service at ${apiUrl}: ${connErr.message}`);
        }

        const videoTarget = payload.uploadFilm || payload.video_path;
        let videoParam = null;

        if (videoTarget && isValidHttpUrl(videoTarget)) {
            try {
                videoParam = handle_file(videoTarget);
            } catch (fileErr) {
                console.warn(`[MLRemoteService] handle_file error (${fileErr.message}), falling back to direct URL object`);
                videoParam = {
                    path: videoTarget,
                    url: videoTarget,
                    orig_name: 'film_video.mp4',
                    meta: { _type: 'gradio.FileData' }
                };
            }
        }

        const inputPayload = {
            video: videoParam,
            subtitles: null,
            ...payload
        };

        console.log(`[MLRemoteService] Submitting analysis request for Film ID: ${payload.film_id} ('${payload.FilmName}') to /analyze`);

        let response;
        try {
            response = await client.predict('/analyze', [inputPayload]);
        } catch (predictErr) {
            throw new Error(`Remote ML pipeline execution failed on /analyze: ${predictErr.message}`);
        }

        if (!response || !response.data) {
            throw new Error('Invalid response structure received from remote ML pipeline');
        }

        let rawReport = Array.isArray(response.data) ? response.data[0] : response.data;

        if (typeof rawReport === 'string') {
            try {
                rawReport = JSON.parse(rawReport);
            } catch (parseErr) {
                throw new Error(`Failed to parse remote report string as JSON: ${parseErr.message}`);
            }
        }

        if (!rawReport || typeof rawReport !== 'object') {
            throw new Error('Remote ML service did not return a valid report object');
        }

        return rawReport;
    }
}

module.exports = new MLRemoteService();
