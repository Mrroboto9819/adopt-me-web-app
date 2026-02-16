import mongoose from 'mongoose';
import { baseSchemaFields, baseSchemaOptions } from './base';
import type { IBase } from './base';

export interface ILoginImage extends IBase {
    _id: string;
    url: string;
    alt?: string;
    order: number; // Display order in carousel
    isActive: boolean;
}

const loginImageSchema = new mongoose.Schema<ILoginImage>({
    ...baseSchemaFields,
    url: { type: String, required: true },
    alt: { type: String, required: false, default: 'Login background image' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, baseSchemaOptions);

// Index for efficient querying of active images in order
loginImageSchema.index({ isActive: 1, order: 1 });

// Delete cached model in development to pick up schema changes
if (process.env.NODE_ENV !== 'production' && mongoose.models.LoginImage) {
    delete mongoose.models.LoginImage;
}

export const LoginImage = mongoose.models.LoginImage || mongoose.model<ILoginImage>('LoginImage', loginImageSchema);
