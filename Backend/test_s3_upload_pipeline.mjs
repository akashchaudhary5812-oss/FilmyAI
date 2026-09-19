import dotenv from 'dotenv';
dotenv.config({ override: true });

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import S3 service (CommonJS)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const s3Service = require('./src/services/s3.service.js');

async function runTests() {
    console.log('========================================================');
    console.log('🧪 FILMYAI — AWS S3 STREAMING & MULTIPART INTEGRATION TEST');
    console.log('========================================================');
    console.log(`Bucket : ${s3Service.getBucketName()}`);
    console.log(`Region : ${s3Service.getRegion()}`);
    console.log('--------------------------------------------------------');

    const tempDir = path.join(__dirname, 'uploads/temp_test');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    // -------------------------------------------------------------
    // Test 1: Small Video / Asset Streaming Upload & Verification
    // -------------------------------------------------------------
    console.log('\n[Test 1] Testing small video asset streaming upload...');
    const smallFilePath = path.join(tempDir, 'small_test_video.mp4');
    const smallContent = Buffer.alloc(1024 * 512, 'a'); // 512 KB
    fs.writeFileSync(smallFilePath, smallContent);

    const smallS3Key = `tests/films/test_small_${Date.now()}.mp4`;
    const smallResult = await s3Service.uploadLocalFile({
        filePath: smallFilePath,
        s3Key: smallS3Key,
        mimeType: 'video/mp4',
        fileSize: smallContent.length,
        metadata: { filmTitle: 'Small Test Video' }
    });

    console.log('✅ Small file S3 upload result:');
    console.log(`   - S3 Key: ${smallResult.s3Key}`);
    console.log(`   - File Size: ${smallResult.fileSize} bytes`);
    console.log(`   - ETag: ${smallResult.etag}`);
    console.log(`   - Presigned URL generated: ${smallResult.presignedUrl.slice(0, 60)}...`);

    if (smallResult.fileSize !== smallContent.length) {
        throw new Error(`Size mismatch: expected ${smallContent.length}, got ${smallResult.fileSize}`);
    }

    // -------------------------------------------------------------
    // Test 2: Multi-part Streaming Upload (15 MB test file to trigger multipart)
    // -------------------------------------------------------------
    console.log('\n[Test 2] Testing multipart streaming upload (15 MB)...');
    const multiFilePath = path.join(tempDir, 'multipart_test_video.mp4');
    
    // Create a 15 MB file using streams to avoid memory spikes
    const multiFileStream = fs.createWriteStream(multiFilePath);
    const chunk = Buffer.alloc(1024 * 1024, 'v'); // 1MB chunk
    for (let i = 0; i < 15; i++) {
        multiFileStream.write(chunk);
    }
    await new Promise((resolve) => multiFileStream.end(resolve));

    const multiSize = fs.statSync(multiFilePath).size;
    console.log(`   Created 15 MB test file (${multiSize} bytes). Uploading in multiple parts...`);

    const multiS3Key = `tests/films/test_multipart_${Date.now()}.mp4`;
    const multiResult = await s3Service.uploadLocalFile({
        filePath: multiFilePath,
        s3Key: multiS3Key,
        mimeType: 'video/mp4',
        fileSize: multiSize,
        metadata: { filmTitle: 'Multipart Test Video', filmId: 'film_test_multipart_15mb' }
    });

    console.log('✅ Multipart file S3 upload result:');
    console.log(`   - S3 Key: ${multiResult.s3Key}`);
    console.log(`   - File Size: ${multiResult.fileSize} bytes`);
    console.log(`   - ETag: ${multiResult.etag}`);

    if (multiResult.fileSize !== multiSize) {
        throw new Error(`Size mismatch on multipart: expected ${multiSize}, got ${multiResult.fileSize}`);
    }

    // -------------------------------------------------------------
    // Cleanup Test S3 Objects and Local Files
    // -------------------------------------------------------------
    console.log('\n[Cleanup] Cleaning up test objects from S3 and local disk...');
    await s3Service.deleteObject(smallS3Key);
    await s3Service.deleteObject(multiS3Key);

    if (fs.existsSync(smallFilePath)) fs.unlinkSync(smallFilePath);
    if (fs.existsSync(multiFilePath)) fs.unlinkSync(multiFilePath);
    if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);

    console.log('\n========================================================');
    console.log('🎉 ALL S3 STREAMING & MULTIPART TESTS PASSED SUCCESSFULLY!');
    console.log('========================================================\n');
}

runTests().catch((err) => {
    console.error('❌ S3 Test Failed:', err);
    process.exit(1);
});
