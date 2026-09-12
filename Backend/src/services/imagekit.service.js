const ImageKit = require('@imagekit/nodejs');
const { toFile } = require('@imagekit/nodejs');

require('dotenv').config();

// Initialize ImageKit
const imagekit = new ImageKit({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
});

const ImageKitService = {

    uploadFile: async (fileBuffer, fileName) => {
        try {

            // Convert Multer Buffer into a format
            // accepted by the ImageKit Node SDK
            const file = await toFile(fileBuffer, fileName);

            const response = await imagekit.files.upload({
                file: file,
                fileName: fileName,
            });

            return response.url;

        } catch (error) {

            console.error("ImageKit Error:", error);

            throw new Error(
                `ImageKit Upload Failed: ${error.message}`
            );
        }
    },

};

module.exports = ImageKitService;