import { connectDB } from '$lib/db';
import mongoose from 'mongoose';

export const load = async () => {
    await connectDB();
    const readyState = mongoose.connection.readyState;

    const states: Record<number, string> = {
        0: 'Disconnected',
        1: 'Connected',
        2: 'Connecting',
        3: 'Disconnecting',
    };

    return {
        dbStatus: states[readyState] || 'Unknown',
        readyState
    };
};
