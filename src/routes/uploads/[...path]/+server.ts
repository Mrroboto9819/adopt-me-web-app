import { error } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

export async function GET({ params }) {
    const filePath = params.path;

    if (!filePath) {
        throw error(404, 'File not found');
    }

    // Prevent directory traversal attacks
    if (filePath.includes('..') || filePath.includes('//')) {
        throw error(400, 'Invalid file path');
    }

    // Determine the correct uploads directory based on environment
    const isProduction = process.env.NODE_ENV === 'production';
    const uploadsBase = isProduction
        ? path.join(process.cwd(), 'build', 'client', 'uploads')
        : path.join(process.cwd(), 'static', 'uploads');

    const fullPath = path.join(uploadsBase, filePath);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
        throw error(404, 'File not found');
    }

    // Check if it's a file (not directory)
    const stats = fs.statSync(fullPath);
    if (!stats.isFile()) {
        throw error(404, 'Not a file');
    }

    // Read file
    const fileBuffer = fs.readFileSync(fullPath);

    // Determine content type based on extension
    const ext = path.extname(fullPath).toLowerCase();
    const contentTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.mov': 'video/quicktime',
        '.avi': 'video/x-msvideo',
        '.mkv': 'video/x-matroska',
        '.m4v': 'video/x-m4v'
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';

    return new Response(fileBuffer, {
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable'
        }
    });
}
