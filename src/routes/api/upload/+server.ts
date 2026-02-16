import { json } from '@sveltejs/kit';
import { verifyToken } from '$lib/auth';
import fs from 'fs';
import path from 'path';

// File size limits
const MAX_IMAGE_SIZE_MB = 10;
const MAX_VIDEO_SIZE_MB = 100;
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v'];

export async function POST({ request }) {
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

    // 3. Validate file sizes
    for (const file of files) {
        const ext = path.extname(file.name).toLowerCase();
        const isVideo = VIDEO_EXTENSIONS.includes(ext);
        const maxSizeMB = isVideo ? MAX_VIDEO_SIZE_MB : MAX_IMAGE_SIZE_MB;
        const fileSizeMB = file.size / (1024 * 1024);

        if (fileSizeMB > maxSizeMB) {
            return json({
                error: `File "${file.name}" is too large (${fileSizeMB.toFixed(1)}MB). Maximum size for ${isVideo ? 'videos' : 'images'} is ${maxSizeMB}MB.`
            }, { status: 400 });
        }
    }

    const uploadedUrls: string[] = [];
    const timestamp = Date.now();

    // 4. Create Directory structure: build/client/uploads/<userId>/<timestamp>/
    // Using simple timestamp to group this batch.
    // Note: In production with adapter-node, static assets are served from build/client
    // In development, they're served from static/
    const isProduction = process.env.NODE_ENV === 'production';
    const uploadDir = isProduction
        ? path.join(process.cwd(), 'build', 'client', 'uploads', userId, timestamp.toString())
        : path.join(process.cwd(), 'static', 'uploads', userId, timestamp.toString());

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 5. Save Files
    for (const file of files) {
        const buffer = await file.arrayBuffer();
        // sanitize filename
        const safeName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const filePath = path.join(uploadDir, safeName);

        // Write file (Bun's writer is great, or node fs)
        fs.writeFileSync(filePath, Buffer.from(buffer));

        // Public URL
        // Content in `static/` is served at root.
        // So `static/uploads/...` -> `/uploads/...`
        const publicUrl = `/uploads/${userId}/${timestamp}/${safeName}`;
        uploadedUrls.push(publicUrl);
    }

    return json({
        files: uploadedUrls
    });
}
