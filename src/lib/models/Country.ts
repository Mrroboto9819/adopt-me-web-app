import mongoose from 'mongoose';
import { baseSchemaFields, baseSchemaOptions } from './base';
import type { IBase } from './base';

export interface ICountry extends IBase {
    _id: string;
    name: string;
    alpha2: string;      // 2-letter ISO code (e.g., "US")
    alpha3: string;      // 3-letter ISO code (e.g., "USA")
    numeric: string;     // ISO numeric code (e.g., "840")
    phoneCode: string;   // Country calling code (e.g., "1" for USA)
    continent?: string;  // Continent (e.g., "North America", "Europe")
    capital?: string;    // Capital city
    timezone?: string;   // IANA timezone (e.g., "America/New_York")
    currency?: string;   // Currency name (e.g., "Dollar", "Euro")
    tld?: string;        // Top level domain (e.g., "us", "uk")
    areaKm2?: number;
    gdpUsd?: string;     // GDP in USD (stored as string due to varying formats)
    flag?: string;       // Flag emoji (e.g., "🇺🇸")
}

const countrySchema = new mongoose.Schema<ICountry>({
    ...baseSchemaFields,
    name: { type: String, required: true },
    alpha2: { type: String, required: true, unique: true, uppercase: true, minlength: 2, maxlength: 2 },
    alpha3: { type: String, required: true, unique: true, uppercase: true, minlength: 3, maxlength: 3 },
    numeric: { type: String, required: true },
    phoneCode: { type: String, required: false },
    continent: { type: String, required: false },
    capital: { type: String, required: false },
    timezone: { type: String, required: false },
    currency: { type: String, required: false },
    tld: { type: String, required: false },
    areaKm2: { type: Number, required: false },
    gdpUsd: { type: String, required: false },
    flag: { type: String, required: false },
}, baseSchemaOptions);

// Index for quick lookups
countrySchema.index({ alpha2: 1 });
countrySchema.index({ alpha3: 1 });
countrySchema.index({ name: 'text' });

// Delete cached model in development to pick up schema changes
if (process.env.NODE_ENV !== 'production' && mongoose.models.Country) {
    delete mongoose.models.Country;
}

export const Country = mongoose.models.Country || mongoose.model<ICountry>('Country', countrySchema);
