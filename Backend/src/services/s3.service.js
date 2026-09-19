const fs = require('fs');
const path = require('path');
const { 
    S3Client, 
    HeadObjectCommand, 
    DeleteObjectCommand,
    GetObjectCommand 
} = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

/**
 * AWS S3 Service for FilmyAI.
 * Handles streaming uploads, AWS multipart uploads for multi-GB film assets,
 * object verification, and secure presigned URL generation.
 */
class S3Service {
    constructor() {
        this.region = process.env.AWS_REGION || 'us-east-1';
        this.bucket = process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME;

        const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY;

        if (!accessKeyId || !secretAccessKey) {
            console.warn('[S3Service] Warning: AWS credentials not fully configured in environment variables.');
        }

        this.s3Client = new S3Client({
            region: this.region,
            credentials: accessKeyId && secretAccessKey ? {
                accessKeyId: accessKeyId.trim(),
                secretAccessKey: secretAccessKey.trim(),
            } : undefined,
        });
    }

    getBucketName() {
        return this.bucket;
    }

    getRegion() {
        return this.region;
    }

    /**
     * Determines standard MIME type from filename extension if not provided.
     */
    getMimeType(filename, defaultMime = 'video/mp4') {
        const ext = path.extname(filename).toLowerCase();
        const mimeMap = {
            '.mp4': 'video/mp4',
            '.mov': 'video/quicktime',
            '.webm': 'video/webm',
            '.avi': 'video/x-msvideo',
            '.mkv': 'video/x-matroska',
            '.mpeg': 'video/mpeg',
            '.mpg': 'video/mpeg',
            '.m4v': 'video/x-m4v',
            '.txt': 'text/plain',
            '.json': 'application/json',
            '.pdf': 'application/pdf',
        };
        return mimeMap[ext] || defaultMime;
    }

    /**
     * Uploads a local file from disk to S3 using streaming and AWS multipart upload.
     * Memory-safe: NEVER reads entire file into RAM (no fs.readFileSync).
     * 
     * @param {Object} options
     * @param {string} options.filePath - Local disk path of the file
     * @param {string} options.s3Key - Destination key in S3 bucket
     * @param {string} [options.mimeType] - MIME type of the file
     * @param {number} [options.fileSize] - Expected file size in bytes for integrity check
     * @param {Object} [options.metadata] - Optional S3 metadata key-value pairs
     * @returns {Promise<{s3Bucket: string, s3Key: string, s3ObjectUrl: string, presignedUrl: string, fileSize: number, etag: string}>}
     */
    async uploadLocalFile({ filePath, s3Key, mimeType, fileSize, metadata = {} }) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`[S3Service] Local file not found at path: ${filePath}`);
        }

        const stat = fs.statSync(filePath);
        const actualSize = fileSize || stat.size;
        const resolvedMime = mimeType || this.getMimeType(filePath);

        if (!this.bucket) {
            throw new Error('[S3Service] AWS_S3_BUCKET is not defined in environment variables.');
        }

        // Calculate dynamic part size based on file size:
        // S3 allows max 10,000 parts. Minimum part size is 5MB.
        // For files < 100MB: 5MB parts
        // For files 100MB - 5GB: 10MB parts
        // For files 5GB - 20GB: 25MB parts
        let partSize = 10 * 1024 * 1024; // 10MB default
        if (actualSize > 5 * 1024 * 1024 * 1024) {
            partSize = 25 * 1024 * 1024; // 25MB
        } else if (actualSize < 100 * 1024 * 1024) {
            partSize = 5 * 1024 * 1024; // 5MB
        }

        console.log(`[S3Service] Initiating streaming upload to S3: s3://${this.bucket}/${s3Key} (${(actualSize / (1024 * 1024)).toFixed(2)} MB, partSize: ${partSize / (1024 * 1024)}MB)`);

        const fileStream = fs.createReadStream(filePath);

        const parallelUploads3 = new Upload({
            client: this.s3Client,
            params: {
                Bucket: this.bucket,
                Key: s3Key,
                Body: fileStream,
                ContentType: resolvedMime,
                Metadata: {
                    'filmy-original-name': metadata.originalFileName || path.basename(filePath),
                    'filmy-uploaded-at': new Date().toISOString(),
                    ...metadata,
                },
            },
            queueSize: 4, // 4 concurrent part uploads
            partSize: partSize,
            leavePartsOnError: false, // Abort incomplete multipart uploads on error
        });

        parallelUploads3.on('httpUploadProgress', (progress) => {
            if (progress.total) {
                const percent = Math.round((progress.loaded / progress.total) * 100);
                if (percent % 25 === 0 || percent === 100) {
                    console.log(`[S3Service] Upload progress for ${s3Key}: ${percent}% (${(progress.loaded / (1024 * 1024)).toFixed(1)} MB / ${(progress.total / (1024 * 1024)).toFixed(1)} MB)`);
                }
            }
        });

        const uploadResult = await parallelUploads3.done();

        // -------------------------------------------------------------
        // Critical File Integrity Verification
        // -------------------------------------------------------------
        const verifiedObject = await this.verifyObject(s3Key, actualSize);

        const s3ObjectUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${s3Key}`;
        let presignedUrl = null;
        try {
            presignedUrl = await this.getPresignedUrl(s3Key, 86400); // 24 hours
        } catch (presignErr) {
            console.warn(`[S3Service] Presigned URL generation warning: ${presignErr.message}`);
        }

        console.log(`[S3Service] ✅ S3 Upload and integrity verification complete for s3://${this.bucket}/${s3Key}`);

        return {
            s3Bucket: this.bucket,
            s3Key: s3Key,
            s3ObjectUrl: s3ObjectUrl,
            presignedUrl: presignedUrl || s3ObjectUrl,
            fileSize: verifiedObject.contentLength,
            mimeType: verifiedObject.contentType || resolvedMime,
            etag: uploadResult.ETag || verifiedObject.etag,
        };
    }

    /**
     * Verifies that the uploaded S3 object exists and matches the local file size.
     * 
     * @param {string} s3Key - S3 Object Key
     * @param {number} expectedSize - Expected size in bytes
     * @returns {Promise<{exists: boolean, contentLength: number, contentType: string, etag: string}>}
     */
    async verifyObject(s3Key, expectedSize) {
        try {
            const headCommand = new HeadObjectCommand({
                Bucket: this.bucket,
                Key: s3Key,
            });

            const headResult = await this.s3Client.send(headCommand);
            const remoteSize = Number(headResult.ContentLength);

            if (expectedSize !== undefined && expectedSize !== null) {
                if (remoteSize !== Number(expectedSize)) {
                    throw new Error(
                        `[S3Service] Integrity mismatch for s3://${this.bucket}/${s3Key}: ` +
                        `Local file size (${expectedSize} bytes) != S3 object size (${remoteSize} bytes)`
                    );
                }
            }

            return {
                exists: true,
                contentLength: remoteSize,
                contentType: headResult.ContentType,
                etag: headResult.ETag,
            };
        } catch (err) {
            console.error(`[S3Service] ❌ Verification failed for s3://${this.bucket}/${s3Key}:`, err.message);
            throw err;
        }
    }

    /**
     * Generates a secure, temporary presigned GET URL for accessing a private S3 object.
     * 
     * @param {string} s3Key - S3 Object Key
     * @param {number} [expiresInSeconds=86400] - Expiration time in seconds (default: 24h)
     * @returns {Promise<string>}
     */
    async getPresignedUrl(s3Key, expiresInSeconds = 86400) {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: s3Key,
        });

        return await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
    }

    /**
     * Deletes an object from S3.
     */
    async deleteObject(s3Key) {
        try {
            const command = new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: s3Key,
            });
            await this.s3Client.send(command);
            console.log(`[S3Service] Deleted s3://${this.bucket}/${s3Key}`);
            return true;
        } catch (err) {
            console.error(`[S3Service] Failed to delete s3://${this.bucket}/${s3Key}:`, err.message);
            return false;
        }
    }
}

module.exports = new S3Service();
