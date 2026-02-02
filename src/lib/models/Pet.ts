import mongoose from 'mongoose';
import { baseSchemaFields, baseSchemaOptions } from './base';
import type { IBase } from './base';

export interface IPet extends IBase {
    _id: string;
    name: string;
    species?: mongoose.Types.ObjectId | string; // Standard Linked Species (or populated object)
    customSpecies?: string; // Manual Entry
    breed?: mongoose.Types.ObjectId | string; // Standard Linked Breed
    customBreed?: string; // Manual Entry
    age?: number;
    gender: 'Male' | 'Female' | 'Unknown';
    size: 'Small' | 'Medium' | 'Large';
    color?: string;
    coverImage?: string;
    images: string[];
    description?: string;
    status: 'Available' | 'Pending' | 'Adopted';
    health?: {
        vaccinated: boolean;
        neutered: boolean;
    };
    owner?: mongoose.Schema.Types.ObjectId; // User who listed the pet
}

const petSchema = new mongoose.Schema<IPet>({
    ...baseSchemaFields,
    name: { type: String, required: true },
    species: { type: mongoose.Schema.Types.ObjectId, ref: 'Species', required: false }, // Link to standard species
    customSpecies: { type: String, required: false }, // For manual entry "Other"
    breed: { type: mongoose.Schema.Types.ObjectId, ref: 'Breed', required: false }, // Link to standard breed
    customBreed: { type: String, required: false }, // For manual entry "Mixed/Other"
    age: { type: Number },
    gender: { type: String, enum: ['Male', 'Female', 'Unknown'], default: 'Unknown' },
    size: { type: String, enum: ['Small', 'Medium', 'Large'], default: 'Medium' },
    color: { type: String },
    coverImage: { type: String }, // Main/Cover image URL
    images: [{ type: String }],   // Gallery URLs
    description: { type: String },
    status: { type: String, enum: ['Available', 'Pending', 'Adopted'], default: 'Available' },
    health: {
        vaccinated: { type: Boolean, default: false },
        neutered: { type: Boolean, default: false },
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, baseSchemaOptions);

export const Pet = mongoose.models.Pet || mongoose.model<IPet>('Pet', petSchema);
