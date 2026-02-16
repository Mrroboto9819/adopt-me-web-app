import mongoose from 'mongoose';
import { baseSchemaFields, baseSchemaOptions } from './base';
import type { IBase } from './base';

export interface IComment extends IBase {
    _id: string;
    content: string;
    author: mongoose.Types.ObjectId;
    post: mongoose.Types.ObjectId;
    parent?: mongoose.Types.ObjectId; // For nested replies
}

const commentSchema = new mongoose.Schema<IComment>({
    ...baseSchemaFields,
    content: { type: String, required: true, maxlength: 2000 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', required: false },
}, baseSchemaOptions);

// Index for fetching comments by post
commentSchema.index({ post: 1, createdAt: -1 });

// Index for fetching replies to a comment
commentSchema.index({ parent: 1, createdAt: 1 });

export const Comment = mongoose.models.Comment || mongoose.model<IComment>('Comment', commentSchema);
