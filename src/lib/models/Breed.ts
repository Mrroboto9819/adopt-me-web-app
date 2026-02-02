import mongoose, { Schema } from 'mongoose';
import { baseSchemaFields, baseSchemaOptions } from './base';
import type { IBase } from './base';

export interface IBreed extends IBase {
    name: string;
    species: mongoose.Types.ObjectId; // Reference to Species
}

const breedSchema = new mongoose.Schema<IBreed>({
    ...baseSchemaFields,
    name: { type: String, required: true },
    species: { type: Schema.Types.ObjectId, ref: 'Species', required: true }
}, baseSchemaOptions);

// Compound index to ensure unique breed names per species
breedSchema.index({ name: 1, species: 1 }, { unique: true });

export const Breed = mongoose.models.Breed || mongoose.model<IBreed>('Breed', breedSchema);
