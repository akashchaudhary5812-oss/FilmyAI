const { toFile } = require('@imagekit/nodejs');

require('dotenv').config();

/**
 * Returns a lazily-initialised ImageKit client.
 * The client is only created when uploadFile() is first called,
 * so the backend starts fine even if IMAGEKIT_PRIVATE_KEY is not yet
 * present in the environment (e.g. during local development without
 * a real ImageKit account).
 */
let _imagekitClient = null;

function getClient() {
    if (_imagekitClient) return _imagekitClient;

    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

    if (!privateKey) {
        throw new Error(
            'IMAGEKIT_PRIVATE_KEY is not set. ' +
            'Add it to Backend/.env before uploading files. ' +
            'See Backend/.env.example for guidance.'
        );
    }

    const ImageKit = require('@imagekit/nodejs');
    _imagekitClient = new ImageKit({ privateKey });
    return _imagekitClient;
}

const ImageKitService = {

    uploadFile: async (fileBuffer, fileName) => {
        try {
            const imagekit = getClient();

            // Convert Multer Buffer into a format accepted by the ImageKit Node SDK
            const file = await toFile(fileBuffer, fileName);

            const response = await imagekit.files.upload({
                file: file,
                fileName: fileName,
            });

            return response.url;

        } catch (error) {
            console.error('ImageKit Error:', error);
            throw new Error(`ImageKit Upload Failed: ${error.message}`);
        }
    },

};

module.exports = ImageKitService;