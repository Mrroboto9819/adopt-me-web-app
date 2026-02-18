import mongoose from 'mongoose';
import * as argon2 from 'argon2';
import bcrypt from 'bcryptjs'; // Keep for backward compatibility with existing passwords
import { baseSchemaFields, baseSchemaOptions } from './base';
import type { IBase } from './base';

import { addressSchema } from './Address';
import type { IAddress } from './Address';

export interface ICoverImageOffset {
    x: number; // Percentage 0-100, where 50 is centered
    y: number; // Percentage 0-100, where 50 is centered
}

export interface IUserWarning {
    reason: string;
    reportId?: mongoose.Types.ObjectId; // Reference to the report that caused this warning
    issuedBy?: mongoose.Types.ObjectId; // Admin who issued the warning
    issuedAt: Date;
    acknowledged: boolean; // Whether the user has seen/acknowledged this warning
    acknowledgedAt?: Date;
}

export interface IUser extends IBase {
    _id: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    secondLastName?: string; // Apellido materno (common in Spanish-speaking countries)
    role: 'user' | 'admin';
    isBanned: boolean;
    banReason?: string;
    address?: IAddress; // Optional embedded address
    timezone?: string;  // IANA timezone string (e.g. "America/New_York")
    profilePicture?: string;
    coverImage?: string;
    coverImageOffset?: ICoverImageOffset; // Position offset for cover image cropping
    preferredSpecies?: mongoose.Types.ObjectId[]; // User's preferred animal species for personalized feed
    language?: 'en' | 'es';
    // Verification
    phone?: string;
    phoneCountryCode?: string; // ISO alpha2 country code (e.g., "US", "MX")
    phoneVerified?: boolean;
    emailVerified?: boolean;
    emailVerificationToken?: string;
    emailVerificationExpires?: Date;
    // Password Reset
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    // App Settings
    theme?: 'light' | 'dark' | 'system';
    // Notification preferences
    notifications?: {
        email: boolean;
        push: boolean;
        sms: boolean;
        newMessages: boolean;
        adoptionUpdates: boolean;
        newsletter: boolean;
    };
    // Warnings/Strikes system
    warnings?: IUserWarning[];
    warningCount?: number; // Denormalized count for quick access
    // Saved posts
    savedPosts?: mongoose.Types.ObjectId[]; // References to saved posts
    // Beta tester flag
    isBeta?: boolean;
    betaAgreedAt?: Date; // When user accepted beta terms
    comparePassword(password: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>({
    ...baseSchemaFields,
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    secondLastName: { type: String, required: false }, // Apellido materno
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, required: false },
    address: { type: addressSchema, required: false },
    timezone: { type: String, required: false, default: 'UTC' },
    profilePicture: { type: String, required: false },
    coverImage: { type: String, required: false },
    coverImageOffset: {
        x: { type: Number, default: 50 }, // Default centered
        y: { type: Number, default: 50 }, // Default centered
    },
    preferredSpecies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Species' }],
    language: { type: String, enum: ['en', 'es'], default: 'en' },
    // Verification
    phone: { type: String, required: false },
    phoneCountryCode: { type: String, required: false }, // ISO alpha2 country code
    phoneVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, required: false },
    emailVerificationExpires: { type: Date, required: false },
    // Password Reset
    passwordResetToken: { type: String, required: false },
    passwordResetExpires: { type: Date, required: false },
    // App Settings
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    // Notification preferences
    notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        newMessages: { type: Boolean, default: true },
        adoptionUpdates: { type: Boolean, default: true },
        newsletter: { type: Boolean, default: false },
    },
    // Warnings/Strikes system
    warnings: [{
        reason: { type: String, required: true },
        reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: false },
        issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
        issuedAt: { type: Date, default: Date.now },
        acknowledged: { type: Boolean, default: false },
        acknowledgedAt: { type: Date, required: false },
    }],
    warningCount: { type: Number, default: 0 },
    // Saved posts
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    // Beta tester flag - default true since all current users are beta testers
    isBeta: { type: Boolean, default: true },
    betaAgreedAt: { type: Date, required: false }, // When user accepted beta terms
}, baseSchemaOptions);

// Hash password before saving using Argon2
userSchema.pre('save', async function () {
    // Only hash if modified (or new)
    // We check if 'passwordHash' was modified because we expect the app to set this field
    // currently. In a full implementation we might use a virtual 'password' field.
    // For now, let's assume the mutation sets 'passwordHash' to the plain text password initially
    // and we hash it here.
    if (!this.isModified('passwordHash')) return;

    // Use Argon2id (recommended variant) with secure defaults
    // - Memory: 65536 KB (64 MB)
    // - Iterations: 3
    // - Parallelism: 4
    this.passwordHash = await argon2.hash(this.passwordHash, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
    });
});

// Helper method to compare password
// Supports both Argon2 (new) and bcrypt (legacy) for backward compatibility
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    const storedHash = this.passwordHash;

    // Check if it's an Argon2 hash (starts with $argon2)
    if (storedHash.startsWith('$argon2')) {
        return await argon2.verify(storedHash, candidatePassword);
    }

    // Legacy bcrypt hash (starts with $2a$ or $2b$)
    // This allows existing users to still log in
    const isValid = await bcrypt.compare(candidatePassword, storedHash);

    // Optional: Auto-upgrade to Argon2 on successful login
    // This gradually migrates all users to Argon2
    if (isValid) {
        this.passwordHash = candidatePassword; // Will be hashed by pre-save hook
        await this.save();
    }

    return isValid;
};

// Delete cached model in development to pick up schema changes
if (process.env.NODE_ENV !== 'production' && mongoose.models.User) {
    delete mongoose.models.User;
}

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
