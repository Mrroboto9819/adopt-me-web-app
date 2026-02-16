import sgMail from '@sendgrid/mail';
import Mailgun from 'mailgun.js';
import formData from 'form-data';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory of this module for template paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMPLATES_DIR = join(__dirname, '..', 'templates', 'email');

// Email provider configuration
// Set EMAIL_PROVIDER to 'mailgun' or 'sendgrid' in .env
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'mailgun';

// SendGrid configuration
const sendgridApiKey = process.env.SENDGRID_API_KEY;
if (sendgridApiKey) {
    sgMail.setApiKey(sendgridApiKey);
}

// Mailgun configuration
const mailgunApiKey = process.env.MAILGUN_API_KEY?.trim();
const mailgunDomain = process.env.MAILGUN_DOMAIN?.trim();
// Set to 'EU' if your Mailgun account is in the EU region, otherwise leave as 'US'
const mailgunRegion = process.env.MAILGUN_REGION?.trim();
let mailgunClient: any = null;

// Debug: Log config on startup (masked key)
// console.log('[Mailgun] Config:', {
//     domain: mailgunDomain,
//     region: mailgunRegion,
//     apiKeyLength: mailgunApiKey?.length,
//     apiKeyStart: mailgunApiKey?.substring(0, 8) + '...',
//     apiKeyEnd: '...' + mailgunApiKey?.substring(mailgunApiKey.length - 8),
//     hasQuotes: mailgunApiKey?.includes("'") || mailgunApiKey?.includes('"'),
// });

if (mailgunApiKey) {
    const mailgun = new Mailgun(formData);
    mailgunClient = mailgun.client({
        username: 'api',
        key: mailgunApiKey,
        // Use EU endpoint if region is EU
        url: mailgunRegion === 'EU' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net',
    });
}

// Common email configuration
const FROM_EMAIL = process.env.EMAIL_FROM || process.env.SENDGRID_FROM_EMAIL || 'noreply@pablocabrera.dev';
const FROM_NAME = process.env.EMAIL_FROM_NAME || process.env.SENDGRID_FROM_NAME || 'AdoptMe';
const APP_URL = process.env.PUBLIC_APP_URL || 'http://localhost:5173';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

/**
 * Load an HTML template file and replace placeholders with values
 * Placeholders use {{key}} syntax
 */
function renderTemplate(templateName: string, variables: Record<string, string>): string {
    const templatePath = join(TEMPLATES_DIR, `${templateName}.html`);
    let html = readFileSync(templatePath, 'utf-8');

    // Replace all {{key}} placeholders with their values
    for (const [key, value] of Object.entries(variables)) {
        html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }

    return html;
}

/**
 * Send email using Mailgun
 */
async function sendWithMailgun(options: EmailOptions): Promise<boolean> {
    if (!mailgunApiKey || !mailgunClient) {
        console.error('[Mailgun] API key not configured - check MAILGUN_API_KEY in .env');
        throw new Error('Email service not configured. Please contact support.');
    }

    console.log(`[Mailgun] Sending email to ${options.to} from ${FROM_EMAIL} via ${mailgunDomain}`);

    try {
        const result = await mailgunClient.messages.create(mailgunDomain, {
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: [options.to],
            subject: options.subject,
            html: options.html,
            text: options.text || options.html.replace(/<[^>]*>/g, ''),
        });
        console.log('[Mailgun] Email sent successfully:', result.id);
        return true;
    } catch (error: any) {
        console.error('[Mailgun] Error sending email:');
        console.error('  Status:', error?.status);
        console.error('  Message:', error?.message);
        if (error?.details) {
            console.error('  Details:', JSON.stringify(error.details, null, 2));
        }

        // Provide user-friendly error messages
        const status = error?.status;
        if (status === 401) {
            throw new Error('Mailgun authentication failed. Check your API key.');
        } else if (status === 400) {
            throw new Error(`Mailgun error: ${error?.message || 'Invalid request'}`);
        } else if (status === 404) {
            throw new Error(`Mailgun domain not found: ${mailgunDomain}. Check MAILGUN_DOMAIN in .env`);
        } else {
            throw new Error(`Failed to send email: ${error?.message || 'Unknown error'}`);
        }
    }
}

/**
 * Send email using SendGrid
 */
async function sendWithSendGrid(options: EmailOptions): Promise<boolean> {
    if (!sendgridApiKey) {
        console.error('[SendGrid] API key not configured - check SENDGRID_API_KEY in .env');
        throw new Error('Email service not configured. Please contact support.');
    }

    console.log(`[SendGrid] Sending email to ${options.to} from ${FROM_EMAIL}`);

    try {
        const response = await sgMail.send({
            to: options.to,
            from: {
                email: FROM_EMAIL,
                name: FROM_NAME,
            },
            subject: options.subject,
            html: options.html,
            text: options.text || options.html.replace(/<[^>]*>/g, ''),
        });
        console.log('[SendGrid] Email sent successfully:', response[0].statusCode);
        return true;
    } catch (error: any) {
        console.error('[SendGrid] Error sending email:');
        console.error('  Status:', error?.code);
        console.error('  Message:', error?.message);
        if (error?.response?.body) {
            console.error('  Response:', JSON.stringify(error.response.body, null, 2));
        }

        // Provide user-friendly error messages based on SendGrid error codes
        const errorCode = error?.code || error?.response?.statusCode;
        if (errorCode === 403) {
            throw new Error('Email sender not verified in SendGrid. Please verify the sender email at sendgrid.com/settings/sender_auth');
        } else if (errorCode === 401) {
            throw new Error('Email service authentication failed. Invalid API key.');
        } else if (errorCode === 400) {
            const body = error?.response?.body;
            const errorMsg = body?.errors?.[0]?.message || 'Invalid request';
            throw new Error(`Email error: ${errorMsg}`);
        } else {
            throw new Error(`Failed to send email: ${error?.message || 'Unknown error'}`);
        }
    }
}

/**
 * Send an email using the configured provider (Mailgun or SendGrid)
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
    console.log(`[Email] Using provider: ${EMAIL_PROVIDER}`);

    if (EMAIL_PROVIDER === 'mailgun') {
        return sendWithMailgun(options);
    } else if (EMAIL_PROVIDER === 'sendgrid') {
        return sendWithSendGrid(options);
    } else {
        // Default to mailgun if provider is not recognized
        console.warn(`[Email] Unknown provider "${EMAIL_PROVIDER}", defaulting to mailgun`);
        return sendWithMailgun(options);
    }
}

/**
 * Generate a random 6-digit verification code
 */
export function generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send email verification code
 */
export async function sendEmailVerificationCode(
    email: string,
    code: string,
    firstName: string,
    language: 'en' | 'es' = 'en'
): Promise<boolean> {
    const translations = {
        en: {
            subject: 'Verify your email - AdoptMe',
            greeting: `Hi ${firstName}!`,
            intro: 'Thanks for signing up with AdoptMe. Please use the verification code below to verify your email address:',
            codeLabel: 'Your verification code:',
            expiry: 'This code will expire in 15 minutes.',
            ignore: "If you didn't request this, you can safely ignore this email.",
            footer: 'The AdoptMe Team',
        },
        es: {
            subject: 'Verifica tu correo - AdoptMe',
            greeting: `Hola ${firstName}!`,
            intro: 'Gracias por registrarte en AdoptMe. Por favor usa el siguiente codigo de verificacion para verificar tu correo electronico:',
            codeLabel: 'Tu codigo de verificacion:',
            expiry: 'Este codigo expirara en 15 minutos.',
            ignore: 'Si no solicitaste esto, puedes ignorar este correo.',
            footer: 'El equipo de AdoptMe',
        },
    };

    const t = translations[language];

    const html = renderTemplate('verification-code', {
        subject: t.subject,
        greeting: t.greeting,
        intro: t.intro,
        codeLabel: t.codeLabel,
        code: code,
        expiry: t.expiry,
        ignore: t.ignore,
        footer: t.footer,
    });

    return sendEmail({
        to: email,
        subject: t.subject,
        html,
    });
}

/**
 * Send welcome email after successful verification
 */
export async function sendWelcomeEmail(
    email: string,
    firstName: string,
    language: 'en' | 'es' = 'en'
): Promise<boolean> {
    const translations = {
        en: {
            subject: 'Welcome to AdoptMe!',
            greeting: `Welcome, ${firstName}!`,
            intro: 'Your email has been verified successfully. You can now enjoy all the features of AdoptMe:',
            feature1: 'Create posts to help pets find homes',
            feature2: 'Report lost or found pets',
            feature3: 'Connect with other pet lovers',
            cta: 'Start Exploring',
            footer: 'The AdoptMe Team',
        },
        es: {
            subject: 'Bienvenido a AdoptMe!',
            greeting: `Bienvenido, ${firstName}!`,
            intro: 'Tu correo ha sido verificado exitosamente. Ahora puedes disfrutar de todas las funciones de AdoptMe:',
            feature1: 'Crea publicaciones para ayudar a mascotas a encontrar hogar',
            feature2: 'Reporta mascotas perdidas o encontradas',
            feature3: 'Conecta con otros amantes de las mascotas',
            cta: 'Empezar a Explorar',
            footer: 'El equipo de AdoptMe',
        },
    };

    const t = translations[language];

    const html = renderTemplate('welcome', {
        subject: t.subject,
        greeting: t.greeting,
        intro: t.intro,
        feature1: t.feature1,
        feature2: t.feature2,
        feature3: t.feature3,
        cta: t.cta,
        appUrl: APP_URL,
        footer: t.footer,
    });

    return sendEmail({
        to: email,
        subject: t.subject,
        html,
    });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
    email: string,
    resetToken: string,
    firstName: string,
    language: 'en' | 'es' = 'en'
): Promise<boolean> {
    const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

    const translations = {
        en: {
            subject: 'Reset your password - AdoptMe',
            greeting: `Hi ${firstName}!`,
            intro: 'We received a request to reset your password. Click the button below to create a new password:',
            buttonText: 'Reset Password',
            orCopyLink: 'Or copy and paste this link into your browser:',
            expiry: 'This link will expire in 1 hour.',
            ignore: "If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.",
            securityTitle: 'Security Notice',
            securityText: 'Never share this link with anyone. AdoptMe will never ask for your password via email.',
            footer: 'The AdoptMe Team',
        },
        es: {
            subject: 'Restablece tu contraseña - AdoptMe',
            greeting: `Hola ${firstName}!`,
            intro: 'Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva contraseña:',
            buttonText: 'Restablecer Contraseña',
            orCopyLink: 'O copia y pega este enlace en tu navegador:',
            expiry: 'Este enlace expirará en 1 hora.',
            ignore: 'Si no solicitaste restablecer tu contraseña, puedes ignorar este correo. Tu contraseña permanecerá sin cambios.',
            securityTitle: 'Aviso de Seguridad',
            securityText: 'Nunca compartas este enlace con nadie. AdoptMe nunca te pedirá tu contraseña por correo.',
            footer: 'El equipo de AdoptMe',
        },
    };

    const t = translations[language];

    const html = renderTemplate('password-reset', {
        subject: t.subject,
        greeting: t.greeting,
        intro: t.intro,
        resetUrl: resetUrl,
        buttonText: t.buttonText,
        orCopyLink: t.orCopyLink,
        expiry: t.expiry,
        ignore: t.ignore,
        securityTitle: t.securityTitle,
        securityText: t.securityText,
        footer: t.footer,
    });

    return sendEmail({
        to: email,
        subject: t.subject,
        html,
    });
}
