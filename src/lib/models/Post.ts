import mongoose from 'mongoose';
import { baseSchemaFields, baseSchemaOptions } from './base';
import { Pet } from './Pet';
import { addressSchema } from './Address';
import type { IBase } from './base';
import type { IAddress } from './Address';

export type PostType = 'post' | 'adopt' | 'missing';
export type ReportType = 'lost' | 'found';
export type PreferredContactMethod = 'phone' | 'email';

export interface IPost extends IBase {
    _id: string;
    title: string;
    description: string;
    author: mongoose.Types.ObjectId;
    pet?: mongoose.Types.ObjectId;
    pets?: mongoose.Types.ObjectId[];
    postType: PostType;
    reportType?: ReportType; // Only for postType: 'missing' - indicates lost or found pet
    preferredContact?: PreferredContactMethod; // For adopt and missing posts - how to contact the author
    tags: string[];
    images: string[];
    video?: string; // Single video URL per post
    location?: string; // Required for adopt/missing, optional for general posts
    adoptionAddress?: IAddress; // Structured address for the meetup/pickup
    isActive: boolean;
}

const postSchema = new mongoose.Schema<IPost>({
    ...baseSchemaFields,
    title: { type: String, required: true },
    description: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: false },
    pets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pet' }],
    postType: { type: String, enum: ['post', 'adopt', 'missing'], default: 'post' },
    reportType: { type: String, enum: ['lost', 'found'], required: false }, // For missing posts
    preferredContact: { type: String, enum: ['phone', 'email'], required: false }, // For adopt/missing posts
    tags: [{ type: String }],
    images: [{ type: String }],
    video: { type: String, required: false },
    location: { type: String, required: false },
    adoptionAddress: { type: addressSchema, required: false },
    isActive: { type: Boolean, default: true }
}, baseSchemaOptions);

// Delete cached model in development to pick up schema changes
if (process.env.NODE_ENV !== 'production' && mongoose.models.Post) {
    delete mongoose.models.Post;
}

export const Post = mongoose.models.Post || mongoose.model<IPost>('Post', postSchema);
