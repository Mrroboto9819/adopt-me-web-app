import mongoose from 'mongoose';
import { baseSchemaFields, baseSchemaOptions } from './base';
import type { IBase } from './base';

export interface ISpecies extends IBase {
    name: string; // e.g., "dog"
    label: string; // e.g., "Dog"
}

const speciesSchema = new mongoose.Schema<ISpecies>({
    ...baseSchemaFields,
    name: { type: String, required: true, unique: true, lowercase: true, trim: true },
    label: { type: String, required: true }
}, baseSchemaOptions);

export const Species = mongoose.models.Species || mongoose.model<ISpecies>('Species', speciesSchema);
