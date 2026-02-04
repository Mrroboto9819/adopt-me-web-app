import mongoose from 'mongoose';
import { baseSchemaFields, baseSchemaOptions } from './base';
import { Pet } from './Pet';
import { addressSchema } from './Address';
import type { IBase } from './base';
import type { IAddress } from './Address';

export type PostType = 'post' | 'adopt' | 'missing';

export interface IPost extends IBase {
    _id: string;
    title: string;
    description: string;
    author: mongoose.Types.ObjectId;
    pet?: mongoose.Types.ObjectId;
    postType: PostType;
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
    postType: { type: String, enum: ['post', 'adopt', 'missing'], default: 'post' },
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
