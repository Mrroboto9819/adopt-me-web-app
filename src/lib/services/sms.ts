import twilio from 'twilio';

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

let twilioClient: twilio.Twilio | null = null;

// Debug: Log config on startup
console.log('[Twilio] Config:', {
    accountSid: accountSid ? `${accountSid.substring(0, 8)}...` : 'NOT SET',
    authToken: authToken ? `${authToken.substring(0, 8)}...` : 'NOT SET',
    verifyServiceSid: verifyServiceSid ? `${verifyServiceSid.substring(0, 8)}...` : 'NOT SET',
});

if (accountSid && authToken) {
    twilioClient = twilio(accountSid, authToken);
}

/**
 * Format phone number to E.164 format
 * @param phoneNumber - The phone number (can include country code or not)
 * @param countryCode - ISO country code (e.g., 'MX', 'US', 'CA')
 * @returns Formatted phone number in E.164 format
 */
export function formatPhoneNumber(phoneNumber: string, countryCode?: string): string {
    // Remove all non-digit characters except leading +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');

    // If already starts with +, assume it's in E.164 format
    if (cleaned.startsWith('+')) {
        return cleaned;
    }

    // Remove leading zeros
    cleaned = cleaned.replace(/^0+/, '');

    // Add country calling code based on ISO country code
    const countryCodes: Record<string, string> = {
        'US': '+1',
        'CA': '+1',
        'MX': '+52',
        // Add more as needed
    };

    const dialCode = countryCode ? countryCodes[countryCode.toUpperCase()] : null;

    if (dialCode) {
        // Check if the number already starts with the country code digits
        const dialDigits = dialCode.replace('+', '');
        if (cleaned.startsWith(dialDigits)) {
            return `+${cleaned}`;
        }
        return `${dialCode}${cleaned}`;
    }

    // If no country code provided and number is 10 digits, assume US/Canada
    if (cleaned.length === 10) {
        return `+1${cleaned}`;
    }

    // Default: add + prefix
    return `+${cleaned}`;
}

/**
 * Send a verification code via SMS using Twilio Verify
 * @param phoneNumber - Phone number in E.164 format (e.g., +525512345678)
 * @returns true if sent successfully
 */
export async function sendPhoneVerificationCode(phoneNumber: string): Promise<boolean> {
    if (!twilioClient || !verifyServiceSid) {
        console.error('[Twilio] Not configured - check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID');
        throw new Error('SMS service not configured. Please contact support.');
    }

    console.log(`[Twilio] Sending verification to ${phoneNumber}`);

    try {
        const verification = await twilioClient.verify.v2
            .services(verifyServiceSid)
            .verifications.create({
                to: phoneNumber,
                channel: 'sms',
            });

        console.log(`[Twilio] Verification sent: ${verification.status}`);
        return verification.status === 'pending';
    } catch (error: any) {
        console.error('[Twilio] Error sending verification:');
        console.error('  Code:', error?.code);
        console.error('  Message:', error?.message);

        // Handle common Twilio errors
        if (error?.code === 60200) {
            throw new Error('Invalid phone number format.');
        } else if (error?.code === 60203) {
            throw new Error('Too many verification attempts. Please wait before trying again.');
        } else if (error?.code === 60205) {
            throw new Error('SMS cannot be sent to this number. Please check the number and try again.');
        } else if (error?.code === 20003) {
            throw new Error('SMS service authentication failed. Please contact support.');
        } else {
            throw new Error(`Failed to send verification: ${error?.message || 'Unknown error'}`);
        }
    }
}

/**
 * Verify a phone verification code using Twilio Verify
 * @param phoneNumber - Phone number in E.164 format
 * @param code - The verification code entered by user
 * @returns true if verified successfully
 */
export async function verifyPhoneCode(phoneNumber: string, code: string): Promise<boolean> {
    if (!twilioClient || !verifyServiceSid) {
        console.error('[Twilio] Not configured');
        throw new Error('SMS service not configured. Please contact support.');
    }

    console.log(`[Twilio] Verifying code for ${phoneNumber}`);

    try {
        const verificationCheck = await twilioClient.verify.v2
            .services(verifyServiceSid)
            .verificationChecks.create({
                to: phoneNumber,
                code: code,
            });

        console.log(`[Twilio] Verification check: ${verificationCheck.status}`);

        if (verificationCheck.status === 'approved') {
            return true;
        } else {
            throw new Error('Invalid verification code.');
        }
    } catch (error: any) {
        console.error('[Twilio] Error verifying code:');
        console.error('  Code:', error?.code);
        console.error('  Message:', error?.message);

        // Handle common Twilio errors
        if (error?.code === 60202) {
            throw new Error('Too many incorrect attempts. Please request a new code.');
        } else if (error?.code === 20404) {
            throw new Error('Verification code expired. Please request a new code.');
        } else if (error?.message === 'Invalid verification code.') {
            throw error;
        } else {
            throw new Error(`Verification failed: ${error?.message || 'Unknown error'}`);
        }
    }
}
