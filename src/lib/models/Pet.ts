import mongoose from 'mongoose';
import { baseSchemaFields, baseSchemaOptions } from './base';
import type { IBase } from './base';

export interface IPet extends IBase {
    _id: string;
    name: string;
    species?: mongoose.Types.ObjectId | string;
    customSpecies?: string;
    breed?: mongoose.Types.ObjectId | string;
    customBreed?: string;
    age?: number;
    gender: 'male' | 'female' | 'unknown';
    size: 'small' | 'medium' | 'large';
    color?: string;
    weight?: number;
    weightUnit?: 'kg' | 'lb';
    coverImage?: string;
    images: string[];
    description?: string;
    status: 'available' | 'pending' | 'adopted' | 'not_for_adoption';
    // Personality & Compatibility
    energyLevel?: 'low' | 'medium' | 'high';
    temperament?: string[];
    goodWithKids?: boolean;
    goodWithDogs?: boolean;
    goodWithCats?: boolean;
    houseTrained?: boolean;
    trainingLevel?: 'none' | 'basic' | 'advanced';
    // Health
    health?: {
        vaccinated: boolean;
        neutered: boolean;
        microchipped: boolean;
    };
    specialNeeds?: string;
    // Adoption
    adoptionFee?: number;
    owner?: mongoose.Schema.Types.ObjectId;
}

const petSchema = new mongoose.Schema<IPet>({
    ...baseSchemaFields,
    name: { type: String, required: true },
    species: { type: mongoose.Schema.Types.ObjectId, ref: 'Species', required: false },
    customSpecies: { type: String, required: false },
    breed: { type: mongoose.Schema.Types.ObjectId, ref: 'Breed', required: false },
    customBreed: { type: String, required: false },
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female', 'unknown'], default: 'unknown' },
    size: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
    color: { type: String },
    weight: { type: Number },
    weightUnit: { type: String, enum: ['kg', 'lb'], default: 'kg' },
    coverImage: { type: String },
    images: [{ type: String }],
    description: { type: String },
    status: { type: String, enum: ['available', 'pending', 'adopted', 'not_for_adoption'], default: 'available' },
    // Personality & Compatibility
    energyLevel: { type: String, enum: ['low', 'medium', 'high'] },
    temperament: [{ type: String }],
    goodWithKids: { type: Boolean },
    goodWithDogs: { type: Boolean },
    goodWithCats: { type: Boolean },
    houseTrained: { type: Boolean },
    trainingLevel: { type: String, enum: ['none', 'basic', 'advanced'] },
    // Health
    health: {
        vaccinated: { type: Boolean, default: false },
        neutered: { type: Boolean, default: false },
        microchipped: { type: Boolean, default: false },
    },
    specialNeeds: { type: String },
    // Adoption
    adoptionFee: { type: Number },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, baseSchemaOptions);

export const Pet = mongoose.models.Pet || mongoose.model<IPet>('Pet', petSchema);
