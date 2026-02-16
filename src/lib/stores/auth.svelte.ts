import { browser } from '$app/environment';

interface User {
    id?: string;
    firstName: string;
    lastName: string;
    secondLastName?: string;
    fullName: string;
    email: string;
    profilePicture?: string;
    language?: string;
    theme?: 'light' | 'dark' | 'system';
    coverImage?: string;
    coverImageOffset?: { x: number; y: number };
    timezone?: string;
    phone?: string;
    phoneCountryCode?: string;
    phoneVerified?: boolean;
    emailVerified?: boolean;
    notifications?: {
        email?: boolean;
        push?: boolean;
        sms?: boolean;
        newMessages?: boolean;
        adoptionUpdates?: boolean;
        newsletter?: boolean;
    };
}

// Admin email for dev/admin features
const ADMIN_EMAIL = "pablo.cabrera.castrejon@gmail.com";

class AuthStore {
    // Internal state
    #token = $state('');
    #user = $state<User | null>(null);

    constructor() {
        if (browser) {
            const storedToken = localStorage.getItem('auth_token');
            const storedUser = localStorage.getItem('auth_user');

            if (storedToken) this.#token = storedToken;
            if (storedUser) {
                try {
                    this.#user = JSON.parse(storedUser);
                } catch {
                    this.#user = null;
                }
            }
        }
    }

    // Getters exposed to the app
    get token() {
        return this.#token;
    }

    get user() {
        return this.#user;
    }

    get isAuthenticated() {
        return !!this.#token;
    }

    get isAdmin() {
        return this.#user?.email === ADMIN_EMAIL;
    }

    // Actions
    login(token: string, user: User) {
        this.#token = token;
        this.#user = user;

        if (browser) {
            localStorage.setItem('auth_token', token);
            localStorage.setItem('auth_user', JSON.stringify(user));
        }
    }

    logout() {
        this.#token = '';
        this.#user = null;

        if (browser) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
        }
    }

    updateUser(patch: Partial<User>) {
        if (!this.#user) return;

        this.#user = {
            ...this.#user,
            ...patch
        };

        if (browser) {
            localStorage.setItem('auth_user', JSON.stringify(this.#user));
        }
    }
}

// Singleton instance
export const auth = new AuthStore();
