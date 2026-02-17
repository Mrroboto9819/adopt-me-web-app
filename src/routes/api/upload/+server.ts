import { json } from '@sveltejs/kit';
import { verifyToken } from '$lib/auth';
import { getUploadsBaseDir } from '$lib/upload-utils';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Video extensions for type detection (not compressed)
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v'];
// Image extensions that can be processed by sharp
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.tiff', '.heic', '.heif'];

// Compression settings
const MAX_IMAGE_DIMENSION = 2048; // Max width or height in pixels
const JPEG_QUALITY = 80; // Quality for JPEG/WebP output
const PNG_COMPRESSION = 8; // PNG compression level (0-9)

// Ensure the base uploads directory exists with proper permissions
function ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        console.log(`[Upload] Creating directory: ${dirPath}`);
        fs.mkdirSync(dirPath, { recursive: true, mode: 0o755 });
    }
}

export async function POST({ request }) {
    try {
        // 1. Authenticate Request (Optional for registration)
        const authHeader = request.headers.get('Authorization');
        let userId = 'anonymous';

        if (authHeader) {
            const token = authHeader.split(' ')[1];
            const payload = verifyToken(token);
            if (payload) {
                userId = payload.userId;
            }
        }

        // 2. Parse FormData
        const formData = await request.formData();
        const files = formData.getAll('file') as File[];

        if (!files || files.length === 0) {
            return json({ error: 'No files uploaded' }, { status: 400 });
        }

        console.log(`[Upload] Processing ${files.length} file(s) for user ${userId}`);

        const uploadedUrls: string[] = [];
        const timestamp = Date.now();

        // 3. Ensure directory structure exists
        const baseDir = getUploadsBaseDir();
        const userDir = path.join(baseDir, userId);
        const uploadDir = path.join(userDir, timestamp.toString());

        // Create directories step by step to ensure they exist
        ensureDirectoryExists(baseDir);
        ensureDirectoryExists(userDir);
        ensureDirectoryExists(uploadDir);

        // 4. Process and Save Files
        for (const file of files) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const ext = path.extname(file.name).toLowerCase();
            const isVideo = VIDEO_EXTENSIONS.includes(ext);
            const isImage = IMAGE_EXTENSIONS.includes(ext);

            // Sanitize filename and change extension to .jpg for compressed images
            let safeName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();

            let finalBuffer = buffer;

            // Compress images (not videos or unsupported formats)
            if (isImage && !isVideo) {
                try {
                    // Get image metadata
                    const metadata = await sharp(buffer).metadata();
                    const originalSize = buffer.length;

                    // Determine if we need to resize
                    const needsResize = (metadata.width && metadata.width > MAX_IMAGE_DIMENSION) ||
                        (metadata.height && metadata.height > MAX_IMAGE_DIMENSION);

                    // Create sharp pipeline
                    let pipeline = sharp(buffer, { failOn: 'none' })
                        // Remove all metadata (EXIF, IPTC, XMP, ICC profile)
                        .rotate() // Auto-rotate based on EXIF orientation before stripping
                        .withMetadata({ orientation: undefined }); // Keep minimal metadata

                    // Resize if needed (maintain aspect ratio)
                    if (needsResize) {
                        pipeline = pipeline.resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, {
                            fit: 'inside',
                            withoutEnlargement: true
                        });
                    }

                    // Output format based on original
                    if (ext === '.png') {
                        finalBuffer = await pipeline
                            .png({ compressionLevel: PNG_COMPRESSION, effort: 7 })
                            .toBuffer();
                    } else if (ext === '.webp') {
                        finalBuffer = await pipeline
                            .webp({ quality: JPEG_QUALITY, effort: 4 })
                            .toBuffer();
                    } else if (ext === '.gif') {
                        // GIFs: just strip metadata, minimal processing to preserve animation
                        finalBuffer = await sharp(buffer, { animated: true })
                            .gif()
                            .toBuffer();
                    } else {
                        // Default to JPEG for all other formats (including HEIC)
                        finalBuffer = await pipeline
                            .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
                            .toBuffer();
                        // Update extension for converted files
                        if (ext !== '.jpg' && ext !== '.jpeg') {
                            safeName = safeName.replace(/\.[^.]+$/, '.jpg');
                        }
                    }

                    const newSize = finalBuffer.length;
                    const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);
                    console.log(`[Upload] Compressed ${file.name}: ${(originalSize / 1024).toFixed(1)}KB -> ${(newSize / 1024).toFixed(1)}KB (${savings}% saved)`);
                } catch (compressError) {
                    // If compression fails, use original buffer
                    console.error(`[Upload] Compression failed for ${file.name}, using original:`, compressError);
                    finalBuffer = buffer;
                }
            }

            const filePath = path.join(uploadDir, safeName);

            // Write file
            fs.writeFileSync(filePath, finalBuffer);
            console.log(`[Upload] Saved: ${filePath}`);

            // Public URL
            const publicUrl = `/uploads/${userId}/${timestamp}/${safeName}`;
            uploadedUrls.push(publicUrl);
        }

        return json({
            files: uploadedUrls
        });
    } catch (error: any) {
        console.error('[Upload] Error:', error);
        return json({ error: error.message || 'Upload failed' }, { status: 500 });
    }
}
