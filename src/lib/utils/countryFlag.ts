export function countryCodeToFlag(alpha2?: string | null): string {
    if (!alpha2 || alpha2.length !== 2) return "";
    const codePoints = alpha2
        .toUpperCase()
        .split("")
        .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

export function isValidFlagEmoji(flag?: string | null): boolean {
    if (!flag) return false;
    return /^(?:[\u{1F1E6}-\u{1F1FF}]{2})$/u.test(flag);
}

export function getCountryFlag(
    flag?: string | null,
    alpha2?: string | null,
): string {
    if (isValidFlagEmoji(flag)) return flag!;
    return countryCodeToFlag(alpha2);
}
