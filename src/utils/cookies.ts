import Cookies from 'js-cookie';

const TOKEN_KEY = 'auth_token';
const TOKEN_OPTIONS = {
    expires: 7, // 7 days
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict' as const, // CSRF protection
    path: '/'
};

export const cookieService = {
    setToken: (token: string): void => {
        Cookies.set(TOKEN_KEY, token, TOKEN_OPTIONS);
    },

    getToken: (): string | undefined => {
        return Cookies.get(TOKEN_KEY);
    },

    removeToken: (): void => {
        Cookies.remove(TOKEN_KEY, { path: '/' });
    },

    hasToken: (): boolean => {
        return !!Cookies.get(TOKEN_KEY);
    }
};
