import { browser } from '$app/environment';

interface User {
    id?: string;
    name: string;
    email: string;
    profilePicture?: string;
}

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
}

// Singleton instance
export const auth = new AuthStore();
