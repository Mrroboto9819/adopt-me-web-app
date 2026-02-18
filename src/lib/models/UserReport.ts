import mongoose from 'mongoose';
import { baseSchemaFields, baseSchemaOptions } from './base';
import type { IBase } from './base';

export type UserReportReason =
    | 'harassment'
    | 'spam'
    | 'scam'
    | 'fake_profile'
    | 'impersonation'
    | 'inappropriate_content'
    | 'animal_abuse'
    | 'threats'
    | 'other';

export type UserReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface IUserReport extends IBase {
    _id: string;
    reasons: UserReportReason[]; // Multiple reasons allowed
    description?: string; // Additional details from the reporter
    reporter: mongoose.Types.ObjectId; // User who made the report
    reportedUser: mongoose.Types.ObjectId; // The user being reported
    status: UserReportStatus;
    adminNotes?: string; // Notes from admin when reviewing
    reviewedBy?: mongoose.Types.ObjectId; // Admin who reviewed the report
    reviewedAt?: Date;
}

const userReportSchema = new mongoose.Schema<IUserReport>({
    ...baseSchemaFields,
    reasons: [{
        type: String,
        enum: ['harassment', 'spam', 'scam', 'fake_profile', 'impersonation', 'inappropriate_content', 'animal_abuse', 'threats', 'other'],
    }],
    description: { type: String, required: false, maxlength: 1000 },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
userReportSchema.index({ reportedUser: 1, reporter: 1 }, { unique: true }); // Prevent duplicate reports from same user
userReportSchema.index({ status: 1, createdAt: -1 }); // For admin dashboard queries
userReportSchema.index({ reportedUser: 1 }); // To find all reports against a user

// Delete cached model in development to pick up schema changes
if (process.env.NODE_ENV !== 'production' && mongoose.models.UserReport) {
    delete mongoose.models.UserReport;
}

export const UserReport = mongoose.models.UserReport || mongoose.model<IUserReport>('UserReport', userReportSchema);
