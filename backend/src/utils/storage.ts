import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from 'dotenv';

// Ensure env vars are loaded
dotenv.config();

const s3 = new S3Client({
  region: process.env.CF_R2_REGION || 'us-east-1',
  endpoint: process.env.CF_R2_ENDPOINT as string,
  credentials: {
    accessKeyId: process.env.CF_R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.CF_R2_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
} as any);

console.log('R2 Configuration:', {
  endpoint: process.env.CF_R2_ENDPOINT,
  region: process.env.CF_R2_REGION,
  bucket: process.env.CF_R2_BUCKET,
  hasAccessKey: !!process.env.CF_R2_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.CF_R2_SECRET_ACCESS_KEY,
});

const BUCKET = process.env.CF_R2_BUCKET || '';

export const uploadToR2 = async (
  key: string,
  body: Buffer | Uint8Array | Blob | string,
  contentType: string
): Promise<string> => {
  console.log(`Uploading to R2: ${key}`);
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  try {
    await s3.send(command);
    console.log(`Upload success: ${key}`);
    return key; // Return the key instead of full URL
  } catch (error) {
    console.error(`R2 upload failed for ${key}:`, error);
    throw error;
  }
};

export const deleteFromR2 = async (key: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  try {
    await s3.send(command);
    console.log(`Deleted from R2: ${key}`);
  } catch (error) {
    console.error(`R2 deletion failed for ${key}:`, error);
    throw error;
  }
};

export const getSignedUrlForAudio = async (urlOrKey: string): Promise<string> => {
  // Extract just the key from the full URL if needed
  let key = urlOrKey;
  if (urlOrKey.startsWith('http')) {
    // Extract key from URL like: https://...r2.cloudflarestorage.com/songs/audio/xxxx_file.mp3
    const parts = urlOrKey.split('/songs/');
    if (parts.length > 1 && parts[1]) {
      key = parts[1]; // Get "audio/xxxx_file.mp3"
    }
  }
  
  console.log(`Generating signed URL for key: ${key}`);
  
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  try {
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour expiry
    console.log(`Generated signed URL successfully`);
    return signedUrl;
  } catch (error) {
    console.error(`Failed to generate signed URL for ${key}:`, error);
    throw error;
  }
};

export { s3 as s3Client };
export { BUCKET as BUCKET_NAME };
