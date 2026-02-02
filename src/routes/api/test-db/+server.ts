import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import mongoose from 'mongoose';

export async function GET() {
    await connectDB();
    const status = mongoose.connection.readyState;
    return json({
        status: status === 1 ? 'Connected' : 'Disconnected',
        state: status
    });
}
