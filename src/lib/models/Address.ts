import mongoose from 'mongoose';

export interface IAddress {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

export const addressSchema = new mongoose.Schema<IAddress>({
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true, default: 'USA' }
}, { _id: false }); // subdocuments don't usually need their own _id in this context
