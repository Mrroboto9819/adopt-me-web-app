import mongoose from 'mongoose';
import { MONGO_URI } from '$env/static/private';

import { seedBreeds, seedCountries } from './seed';

export const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        return;
    }

    if (!MONGO_URI) {
        throw new Error('Please define the MONGO_URI environment variable inside .env');
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected');
        await seedBreeds();
        await seedCountries();
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
    }
};
