import { json } from '@sveltejs/kit';
import { verifyToken } from '$lib/auth';
import fs from 'fs';
import path from 'path';

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
        // /uploads/userId/timestamp/file.jpg -> static/uploads/userId/timestamp/file.jpg
        const relativePath = fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl;
        const filePath = path.join(process.cwd(), 'static', relativePath);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);

            // Try to clean up empty parent directories
            const parentDir = path.dirname(filePath);
            try {
                const files = fs.readdirSync(parentDir);
                if (files.length === 0) {
                    fs.rmdirSync(parentDir);
                }
            } catch {
                // Ignore errors when cleaning up directories
            }

            return json({ success: true, message: 'File deleted successfully' });
        } else {
            // File doesn't exist, consider it deleted
            return json({ success: true, message: 'File already deleted or not found' });
        }
    } catch (error: any) {
        console.error('Error deleting file:', error);
        return json({ error: 'Failed to delete file' }, { status: 500 });
    }
}
