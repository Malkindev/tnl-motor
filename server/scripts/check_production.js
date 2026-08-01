#!/usr/bin/env node
// Check required environment variables and optional S3 connectivity
import dotenv from 'dotenv';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

dotenv.config();

const required = ['JWT_SECRET','ADMIN_EMAIL','ADMIN_PASSWORD','FRONTEND_URL'];
let missing = [];
for (const k of required) if (!process.env[k]) missing.push(k);

console.log('Checking required environment variables...');
if (missing.length) {
  console.error('Missing required env vars:', missing.join(', '));
} else {
  console.log('All required env vars present.');
}

if (process.env.S3_BUCKET) {
  console.log('S3_BUCKET is set — checking S3 connectivity...');
  const client = new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || ''
    },
    endpoint: process.env.S3_ENDPOINT || undefined
  });
  (async () => {
    try {
      await client.send(new HeadBucketCommand({ Bucket: process.env.S3_BUCKET }));
      console.log('S3 bucket is reachable and credentials look valid.');
    } catch (err) {
      console.error('S3 check failed:', err.message || err);
    }
  })();
} else {
  console.log('S3_BUCKET not set — uploads will use local disk (not suitable for multi-instance deployments).');
}

if (missing.length) process.exit(2);
