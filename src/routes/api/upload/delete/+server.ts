import { json } from '@sveltejs/kit';
import { verifyToken } from '$lib/auth';
import fs from 'fs';
import path from 'path';

// Get the base uploads directory based on environment
function getUploadsBaseDir(): string {
    const isProduction = process.env.NODE_ENV === 'production';
    return isProduction
        ? path.join(process.cwd(), 'build', 'client', 'uploads')
        : path.join(process.cwd(), 'static', 'uploads');
}

export async function POST({ request }) {
    // 1. Authenticate Request
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
        return json({ error: 'Invalid token' }, { status: 401 });
    }

    // 2. Get the file URL to delete
    const body = await request.json();
    const { fileUrl } = body;

    if (!fileUrl) {
        return json({ error: 'No file URL provided' }, { status: 400 });
    }

    // 3. Validate the file belongs to this user (security check)
    // File URLs are like: /uploads/{userId}/{timestamp}/{filename}
    const urlParts = fileUrl.split('/');
    if (urlParts.length < 4 || urlParts[1] !== 'uploads') {
        return json({ error: 'Invalid file URL format' }, { status: 400 });
    }

    const fileUserId = urlParts[2];

    // Only allow users to delete their own files (or anonymous files they uploaded)
    if (fileUserId !== payload.userId && fileUserId !== 'anonymous') {
        return json({ error: 'Cannot delete files from other users' }, { status: 403 });
    }

    // 4. Delete the file
    try {
        // Convert URL path to file system path
        // /uploads/userId/timestamp/file.jpg -> {baseDir}/userId/timestamp/file.jpg
        const baseDir = getUploadsBaseDir();
        const relativePath = urlParts.slice(2).join('/'); // userId/timestamp/file.jpg
        const filePath = path.join(baseDir, relativePath);

        console.log(`[Delete] Attempting to delete: ${filePath}`);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[Delete] Successfully deleted: ${filePath}`);

            // Try to clean up empty parent directories (timestamp folder, then user folder)
            const timestampDir = path.dirname(filePath);
            const userDir = path.dirname(timestampDir);

            try {
                // Clean timestamp directory if empty
                const timestampFiles = fs.readdirSync(timestampDir);
                if (timestampFiles.length === 0) {
                    fs.rmdirSync(timestampDir);
                    console.log(`[Delete] Removed empty timestamp directory: ${timestampDir}`);

                    // Clean user directory if empty
                    const userFiles = fs.readdirSync(userDir);
                    if (userFiles.length === 0) {
                        fs.rmdirSync(userDir);
                        console.log(`[Delete] Removed empty user directory: ${userDir}`);
                    }
                }
            } catch (cleanupError) {
                // Ignore errors when cleaning up directories
                console.log(`[Delete] Could not clean up directories (not empty or error)`);
            }

            return json({ success: true, message: 'File deleted successfully' });
        } else {
            console.log(`[Delete] File not found: ${filePath}`);
            // File doesn't exist, consider it deleted
            return json({ success: true, message: 'File already deleted or not found' });
        }
    } catch (error: any) {
        console.error('[Delete] Error deleting file:', error);
        return json({ error: 'Failed to delete file' }, { status: 500 });
    }
}
