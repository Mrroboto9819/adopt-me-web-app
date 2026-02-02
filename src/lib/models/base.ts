import type { SchemaDefinition } from 'mongoose';

export interface IBase {
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export const baseSchemaFields: SchemaDefinition = {
    isActive: { type: Boolean, default: true },
};

export const baseSchemaOptions = {
    timestamps: true,
};
