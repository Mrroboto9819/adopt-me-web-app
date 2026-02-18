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
    isAdmin?: boolean;
    isBeta?: boolean;
    betaAgreedAt?: string;
    notifications?: {
        email?: boolean;
        push?: boolean;
        sms?: boolean;
        newMessages?: boolean;
        adoptionUpdates?: boolean;
        newsletter?: boolean;
    };
}

class AuthStore {
    // Internal state
    #token = $state('');
    #user = $state<User | null>(null);
    #loading = $state(false);
    #wasBanned = $state(false);
    #banReason = $state<string | null>(null);

    constructor() {
        if (browser) {
            // Clean up legacy auth_user data (no longer used)
            localStorage.removeItem('auth_user');

            const storedToken = localStorage.getItem('auth_token');
            if (storedToken) {
                this.#token = storedToken;
                // Fetch user info with the stored token
                this.fetchMe();
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
        return this.#user?.isAdmin ?? false;
    }

    get loading() {
        return this.#loading;
    }

    get wasBanned() {
        return this.#wasBanned;
    }

    get banReason() {
        return this.#banReason;
    }

    // Clear the banned state (call after showing the message to the user)
    clearBannedState() {
        this.#wasBanned = false;
        this.#banReason = null;
    }

    // Fetch user info using the token
    async fetchMe(): Promise<User | null> {
        if (!this.#token) return null;

        this.#loading = true;
        try {
            const response = await fetch('/api/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.#token}`
                },
                body: JSON.stringify({
                    query: `query Me {
                        me {
                            id
                            firstName
                            lastName
                            secondLastName
                            fullName
                            email
                            profilePicture
                            language
                            theme
                            phone
                            phoneCountryCode
                            phoneVerified
                            emailVerified
                            isAdmin
                            isBeta
                            betaAgreedAt
                        }
                    }`
                })
            });

            const result = await response.json();

            // Check if user is banned
            if (result.errors?.some((e: any) => e.extensions?.code === 'USER_BANNED')) {
                const bannedError = result.errors.find((e: any) => e.extensions?.code === 'USER_BANNED');
                this.#wasBanned = true;
                this.#banReason = bannedError?.message || 'Your account has been suspended';
                this.logout();
                return null;
            }

            if (result.data?.me) {
                this.#user = result.data.me;
                return this.#user;
            } else {
                // Token is invalid, clear it
                this.logout();
                return null;
            }
        } catch (error) {
            console.error('Failed to fetch user info:', error);
            this.logout();
            return null;
        } finally {
            this.#loading = false;
        }
    }

    // Actions
    login(token: string, user: User) {
        this.#token = token;
        this.#user = user;

        if (browser) {
            // Only save the token, not the user info
            localStorage.setItem('auth_token', token);
        }
    }

    logout() {
        this.#token = '';
        this.#user = null;

        if (browser) {
            localStorage.removeItem('auth_token');
        }
    }

    updateUser(patch: Partial<User>) {
        if (!this.#user) return;

        this.#user = {
            ...this.#user,
            ...patch
        };
    }
}

// Singleton instance
export const auth = new AuthStore();
