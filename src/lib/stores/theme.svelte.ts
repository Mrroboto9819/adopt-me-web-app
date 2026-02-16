import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'system';

// Callback for when theme changes (to save to database)
let onThemeChangeCallback: ((theme: Theme) => void) | null = null;

class ThemeStore {
    #theme = $state<Theme>('system');
    #resolvedTheme = $state<'light' | 'dark'>('light');

    constructor() {
        if (browser) {
            const storedTheme = localStorage.getItem('theme') as Theme | null;
            if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
                this.#theme = storedTheme;
            }
            this.#updateResolvedTheme();
            this.#applyTheme();

            // Listen for system theme changes
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                if (this.#theme === 'system') {
                    this.#updateResolvedTheme();
                    this.#applyTheme();
                }
            });
        }
    }

    get theme() {
        return this.#theme;
    }

    get resolvedTheme() {
        return this.#resolvedTheme;
    }

    get isDark() {
        return this.#resolvedTheme === 'dark';
    }

    #updateResolvedTheme() {
        if (this.#theme === 'system') {
            this.#resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } else {
            this.#resolvedTheme = this.#theme;
        }
    }

    #applyTheme() {
        if (!browser) return;

        const root = document.documentElement;
        if (this.#resolvedTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }

    setTheme(newTheme: Theme, saveToDb = true) {
        this.#theme = newTheme;

        if (browser) {
            localStorage.setItem('theme', newTheme);
        }

        this.#updateResolvedTheme();
        this.#applyTheme();

        // Trigger callback to save to database (if user is logged in)
        if (saveToDb && onThemeChangeCallback) {
            onThemeChangeCallback(newTheme);
        }
    }

    // Load theme from user data (called on login, doesn't trigger db save)
    loadFromUser(userTheme: string | null | undefined) {
        if (userTheme && ['light', 'dark', 'system'].includes(userTheme)) {
            this.setTheme(userTheme as Theme, false);
        }
    }

    // Set callback for when theme changes (to save to database)
    onThemeChange(callback: (theme: Theme) => void) {
        onThemeChangeCallback = callback;
    }

    // Clear callback (on logout)
    clearOnThemeChange() {
        onThemeChangeCallback = null;
    }
}

export const theme = new ThemeStore();
