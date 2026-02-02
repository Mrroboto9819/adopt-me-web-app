import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { baseSchemaFields, baseSchemaOptions } from './base';
import type { IBase } from './base';

import { addressSchema } from './Address';
import type { IAddress } from './Address';

export interface IUser extends IBase {
    _id: string;
    email: string;
    passwordHash: string;
    name: string;
    role: 'user' | 'admin';
    address?: IAddress; // Optional embedded address
    timezone?: string;  // IANA timezone string (e.g. "America/New_York")
    profilePicture?: string;
    coverImage?: string;
    comparePassword(password: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>({
    ...baseSchemaFields,
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    address: { type: addressSchema, required: false },
    timezone: { type: String, required: false, default: 'UTC' }, // Default to UTC
    profilePicture: { type: String, required: false },
    coverImage: { type: String, required: false },
}, baseSchemaOptions);

// Hash password before saving
userSchema.pre('save', async function () {
    // Only hash if modified (or new)
    // We check if 'passwordHash' was modified because we expect the app to set this field 
    // currently. In a full implementation we might use a virtual 'password' field.
    // For now, let's assume the mutation sets 'passwordHash' to the plain text password initially
    // and we hash it here.
    if (!this.isModified('passwordHash')) return;

    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Helper method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
