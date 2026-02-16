import mongoose from 'mongoose';
import { baseSchemaFields, baseSchemaOptions } from './base';
import type { IBase } from './base';

export interface IBugReport extends IBase {
    _id: string;
    title: string;
    description: string;
    category: 'bug' | 'feature' | 'improvement' | 'other';
    severity: 'low' | 'medium' | 'high' | 'critical';
    page?: string; // URL or page name where the bug occurred
    browser?: string;
    device?: string;
    screenshot?: string; // Optional screenshot URL
    reporter?: mongoose.Schema.Types.ObjectId;
    reporterEmail?: string; // For anonymous reports
    status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'wont_fix';
    adminNotes?: string;
}

const bugReportSchema = new mongoose.Schema<IBugReport>({
    ...baseSchemaFields,
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
        type: String,
        enum: ['bug', 'feature', 'improvement', 'other'],
        default: 'bug'
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    page: { type: String },
    browser: { type: String },
    device: { type: String },
    screenshot: { type: String },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reporterEmail: { type: String },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved', 'closed', 'wont_fix'],
        default: 'open'
    },
    adminNotes: { type: String },
}, baseSchemaOptions);

// Delete cached model in development to pick up schema changes
if (process.env.NODE_ENV !== 'production' && mongoose.models.BugReport) {
    delete mongoose.models.BugReport;
}

export const BugReport = mongoose.models.BugReport || mongoose.model<IBugReport>('BugReport', bugReportSchema);
