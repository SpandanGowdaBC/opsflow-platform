import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    businessId: string;
}

interface Business {
    id: string;
    name: string;
    industry?: string;
    email: string;
    onboardingComplete: boolean;
}

interface AuthState {
    user: User | null;
    business: Business | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    setAuth: (token: string, user: User, business: Business) => void;
    clearAuth: () => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            business: null,
            token: null,
            isAuthenticated: false,
            isLoading: true,

            setAuth: (token, user, business) => {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('token', token);
                }
                set({ token, user, business, isAuthenticated: true, isLoading: false });
            },

            clearAuth: () => {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                }
                set({ token: null, user: null, business: null, isAuthenticated: false, isLoading: false });
            },

            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'opsflow-auth',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
