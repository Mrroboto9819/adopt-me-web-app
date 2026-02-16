import betaInviteHtmlEn from './beta-invite.html?raw';
import betaInviteHtmlEs from './beta-invite-es.html?raw';

interface BetaInviteParams {
    name: string;
    appUrl: string;
    language?: 'en' | 'es';
}

/**
 * Generate a beta invite email HTML
 */
export function generateBetaInviteEmail(params: BetaInviteParams): string {
    const { name, appUrl, language = 'en' } = params;

    let html = language === 'es' ? betaInviteHtmlEs : betaInviteHtmlEn;

    html = html.replace(/\{\{NAME\}\}/g, name);
    html = html.replace(/\{\{APP_URL\}\}/g, appUrl);

    return html;
}

/**
 * Get email subject line by language
 */
export function getBetaInviteSubject(language: 'en' | 'es' = 'en'): string {
    return language === 'es'
        ? "🐾 ¡Estás Invitado a Probar AdoptMe!"
        : "🐾 You're Invited to Test AdoptMe!";
}

/**
 * Email subject lines (legacy - use getBetaInviteSubject for i18n)
 */
export const emailSubjects = {
    betaInvite: "🐾 You're Invited to Test AdoptMe!",
    betaInviteEs: "🐾 ¡Estás Invitado a Probar AdoptMe!",
};
