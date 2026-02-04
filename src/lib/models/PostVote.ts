import mongoose from 'mongoose';
import { baseSchemaFields, baseSchemaOptions } from './base';
import type { IBase } from './base';

export type VoteValue = 1 | -1; // 1 = upvote/like, -1 = downvote/dislike

export interface IPostVote extends IBase {
    _id: string;
    user: mongoose.Types.ObjectId;
    post: mongoose.Types.ObjectId;
    value: VoteValue;
}

const postVoteSchema = new mongoose.Schema<IPostVote>({
    ...baseSchemaFields,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    value: { type: Number, enum: [1, -1], required: true },
}, baseSchemaOptions);

// Ensure a user can only vote once per post
postVoteSchema.index({ user: 1, post: 1 }, { unique: true });

// Index for efficient vote counting per post
postVoteSchema.index({ post: 1, value: 1 });

export const PostVote = mongoose.models.PostVote || mongoose.model<IPostVote>('PostVote', postVoteSchema);
