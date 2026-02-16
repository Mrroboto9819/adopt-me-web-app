import sanitizeHtml from 'sanitize-html';

/**
 * Sanitization options for different content types
 */

// Strict mode: No HTML allowed, just plain text
const strictOptions: sanitizeHtml.IOptions = {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard'
};

// Basic mode: Allow formatting from rich text editor
// ALLOWS: bold, italic, links, paragraphs, lists
// BLOCKS: script, iframe, style, img, form, input, onclick, onerror, etc.
const basicOptions: sanitizeHtml.IOptions = {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'ul', 'ol', 'li'],
    allowedAttributes: {
        'a': ['href', 'title', 'target', 'rel']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
        'a': (tagName, attribs) => ({
            tagName,
            attribs: {
                ...attribs,
                target: '_blank',
                rel: 'noopener noreferrer'
            }
        })
    },
    disallowedTagsMode: 'discard'
};

/**
 * Sanitize text input - removes all HTML tags
 * Use for: titles, names, tags, single-line inputs
 */
export function sanitizeText(input: string | undefined | null): string {
    if (!input) return '';
    return sanitizeHtml(input.trim(), strictOptions);
}

/**
 * Sanitize description/content - allows minimal formatting
 * Use for: post descriptions, pet descriptions, comments
 */
export function sanitizeDescription(input: string | undefined | null): string {
    if (!input) return '';
    return sanitizeHtml(input.trim(), basicOptions);
}

/**
 * Sanitize and validate URL
 * Returns empty string if invalid
 */
export function sanitizeUrl(input: string | undefined | null): string {
    if (!input) return '';

    const trimmed = input.trim();

    // Allow root-relative URLs for local static assets (e.g. /uploads/...)
    // but block protocol-relative URLs (//example.com)
    if (trimmed.startsWith('/')) {
        if (trimmed.startsWith('//')) return '';
        return trimmed;
    }

    // Only allow http, https protocols
    try {
        const url = new URL(trimmed);
        if (!['http:', 'https:'].includes(url.protocol)) {
            return '';
        }
        return url.href;
    } catch {
        return '';
    }
}

/**
 * Sanitize array of strings (e.g., tags)
 */
export function sanitizeArray(input: string[] | undefined | null): string[] {
    if (!input || !Array.isArray(input)) return [];
    return input
        .map(item => sanitizeText(item))
        .filter(item => item.length > 0);
}

/**
 * Sanitize array of URLs (e.g., images)
 */
export function sanitizeUrlArray(input: string[] | undefined | null): string[] {
    if (!input || !Array.isArray(input)) return [];
    return input
        .map(item => sanitizeUrl(item))
        .filter(item => item.length > 0);
}

/**
 * Sanitize location string
 * Removes potentially dangerous characters while keeping valid address chars
 */
export function sanitizeLocation(input: string | undefined | null): string {
    if (!input) return '';
    // Remove HTML and trim
    const cleaned = sanitizeText(input);
    // Only allow alphanumeric, spaces, commas, periods, hyphens, and common address characters
    return cleaned.replace(/[^a-zA-Z0-9\s,.\-#áéíóúñüÁÉÍÓÚÑÜ]/g, '').trim();
}

/**
 * Sanitize address object
 */
export function sanitizeAddress(address: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
} | undefined | null): {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
} | null {
    if (!address) return null;

    const sanitized = {
        street: sanitizeLocation(address.street),
        city: sanitizeLocation(address.city),
        state: sanitizeLocation(address.state),
        zipCode: sanitizeText(address.zipCode)?.replace(/[^a-zA-Z0-9\s\-]/g, '') || '',
        country: sanitizeLocation(address.country)
    };

    // Return null if all fields are empty
    if (!sanitized.street && !sanitized.city && !sanitized.state && !sanitized.zipCode) {
        return null;
    }

    return sanitized;
}
