import mongoose from 'mongoose';
import { baseSchemaFields, baseSchemaOptions } from './base';
import type { IBase } from './base';

export type ReportReason =
    | 'spam'
    | 'inappropriate'
    | 'harassment'
    | 'scam'
    | 'animal_abuse'
    | 'fake_listing'
    | 'other';

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface IReport extends IBase {
    _id: string;
    reasons: ReportReason[]; // Multiple reasons allowed
    description?: string; // Additional details from the reporter
    reporter: mongoose.Types.ObjectId; // User who made the report
    post: mongoose.Types.ObjectId; // The reported post
    postOwner: mongoose.Types.ObjectId; // Owner of the reported post (denormalized for easier querying)
    status: ReportStatus;
    adminNotes?: string; // Notes from admin when reviewing
    reviewedBy?: mongoose.Types.ObjectId; // Admin who reviewed the report
    reviewedAt?: Date;
}

const reportSchema = new mongoose.Schema<IReport>({
    ...baseSchemaFields,
    reasons: [{
        type: String,
        enum: ['spam', 'inappropriate', 'harassment', 'scam', 'animal_abuse', 'fake_listing', 'other'],
    }],
    description: { type: String, required: false, maxlength: 1000 },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    postOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
        default: 'pending'
    },
    adminNotes: { type: String, required: false },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    reviewedAt: { type: Date, required: false },
}, baseSchemaOptions);

// Index for efficient querying
reportSchema.index({ post: 1, reporter: 1 }, { unique: true }); // Prevent duplicate reports from same user
reportSchema.index({ status: 1, createdAt: -1 }); // For admin dashboard queries
reportSchema.index({ postOwner: 1 }); // To find all reports against a user

// Delete cached model in development to pick up schema changes
if (process.env.NODE_ENV !== 'production' && mongoose.models.Report) {
    delete mongoose.models.Report;
}

export const Report = mongoose.models.Report || mongoose.model<IReport>('Report', reportSchema);
