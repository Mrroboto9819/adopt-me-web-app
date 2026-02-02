import { json } from '@sveltejs/kit';
import { verifyToken } from '$lib/auth';
import fs from 'fs';
import path from 'path';

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

    const uploadedUrls: string[] = [];
    const timestamp = Date.now();

    // 3. Create Directory structure: static/uploads/<userId>/<timestamp>/
    // Using simple timestamp to group this batch.
    // Note: In SvelteKit `static` assets are served from root `/`. 
    // We physically write to `static/uploads...` in the project dir.
    const uploadDir = path.join(process.cwd(), 'static', 'uploads', userId, timestamp.toString());

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 4. Save Files
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
