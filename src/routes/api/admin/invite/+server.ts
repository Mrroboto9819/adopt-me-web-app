import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { verifyToken } from '$lib/auth';
import { User } from '$lib/models/User';
import { sendBetaInviteEmail } from '$lib/services/email';
import { connectDB } from '$lib/db';

import { ADMIN_EMAIL } from '$env/static/private';

// Admin email - only this user can send invites
export async function POST({ request }: RequestEvent) {
    try {
        // Connect to database
        await connectDB();

        // Verify authentication
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return json({ success: false, error: 'Invalid token' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return json({ success: false, error: 'Invalid token' }, { status: 401 });
        }

        // Verify the user is admin
        const user = await User.findById(payload.userId);
        if (!user || user.email !== ADMIN_EMAIL) {
            return json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        // Parse request body
        const body = await request.json();
        const { name, email, language = 'en' } = body;

        // Validate input
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return json({ success: false, error: 'Name is required' }, { status: 400 });
        }

        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return json({ success: false, error: 'Valid email is required' }, { status: 400 });
        }

        if (language !== 'en' && language !== 'es') {
            return json({ success: false, error: 'Language must be "en" or "es"' }, { status: 400 });
        }

        // Send the invite email
        await sendBetaInviteEmail(email.trim(), name.trim(), language);

        console.log(`[Admin] Beta invite sent to ${email} (${name}) by admin ${user.email}`);

        return json({
            success: true,
            message: `Invite sent to ${email}`,
        });
    } catch (error: any) {
        console.error('[Admin] Error sending invite:', error);
        return json(
            { success: false, error: error.message || 'Failed to send invite' },
            { status: 500 }
        );
    }
}
