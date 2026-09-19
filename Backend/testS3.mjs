import dotenv from "dotenv";
dotenv.config({ override: true });

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// --------------------------------------------------
// Paths
// --------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --------------------------------------------------
// Environment validation
// --------------------------------------------------
const requiredEnv = [
    "AWS_ACCESS_KEY",
    "AWS_SECRET_KEY",
    "AWS_REGION",
    "AWS_S3_BUCKET",
];

for (const key of requiredEnv) {
    if (!process.env[key]) {
        console.error(`❌ Missing environment variable: ${key}`);
        process.exit(1);
    }
}

// --------------------------------------------------
// AWS S3 Client
// Explicit credentials prevent stale credential-chain issues.
// --------------------------------------------------
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    },
});

// --------------------------------------------------
// Test file
// --------------------------------------------------
const testFileName = "s3-test.txt";
const testFilePath = path.join(__dirname, testFileName);

const testContent = [
    "FilmyAI AWS S3 connection test",
    `Timestamp: ${new Date().toISOString()}`,
    "If this file exists in S3, the connection is working.",
].join("\n");

fs.writeFileSync(testFilePath, testContent, "utf8");

// --------------------------------------------------
// S3 destination
// --------------------------------------------------
const s3Key = `tests/${Date.now()}-s3-test.txt`;

console.log("========================================");
console.log("FilmyAI S3 Connection Test");
console.log("========================================");
console.log(`Region : ${process.env.AWS_REGION}`);
console.log(`Bucket : ${process.env.AWS_S3_BUCKET}`);
console.log(`Key    : ${s3Key}`);
console.log("----------------------------------------");
console.log("Uploading test file...");

// --------------------------------------------------
// Upload
// --------------------------------------------------
try {
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: s3Key,
        Body: fs.createReadStream(testFilePath),
        ContentType: "text/plain",
    });

    const response = await s3.send(command);

    console.log("✅ S3 upload successful!");
    console.log(`ETag: ${response.ETag ?? "N/A"}`);
    console.log("");
    console.log("Check your AWS S3 bucket:");
    console.log(`s3://${process.env.AWS_S3_BUCKET}/${s3Key}`);
} catch (error) {
    console.error("❌ S3 upload failed");
    console.error(`Error: ${error.message}`);

    if (error.name) {
        console.error(`Type : ${error.name}`);
    }

    if (error.$metadata) {
        console.error(`HTTP : ${error.$metadata.httpStatusCode ?? "N/A"}`);
    }

    process.exitCode = 1;
} finally {
    // ------------------------------------------------
    // Cleanup local test file
    // ------------------------------------------------
    try {
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    } catch (cleanupError) {
        console.error(
            `⚠️ Could not remove local test file: ${cleanupError.message}`
        );
    }
}