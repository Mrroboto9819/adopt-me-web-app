import mongoose from 'mongoose';
import { baseSchemaFields, baseSchemaOptions } from './base';
import { Pet } from './Pet';
import { addressSchema } from './Address';
import type { IBase } from './base';
import type { IAddress } from './Address';

export interface IPost extends IBase {
    _id: string;
    title: string;
    description: string;
    author: mongoose.Types.ObjectId;
    pet: mongoose.Types.ObjectId;
    location: string; // Keep simple string for display or legacy
    adoptionAddress?: IAddress; // Structured address for the meetup/pickup
    isActive: boolean;
}

const postSchema = new mongoose.Schema<IPost>({
    ...baseSchemaFields,
    title: { type: String, required: true },
    description: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
    location: { type: String, required: true },
    adoptionAddress: { type: addressSchema, required: false },
    isActive: { type: Boolean, default: true }
}, baseSchemaOptions);

export const Post = mongoose.models.Post || mongoose.model<IPost>('Post', postSchema);
