import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';

/**
 * Auth store — manages JWT token, decoded user session, and role-based access.
 *
 * The backend JWT payload contains: { id, username, role }
 * On login, we store the raw token + decoded user info.
 * The `persist` middleware saves to localStorage so sessions survive page refreshes.
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // ── State ──
      token: null,
      user: null,       // { id, username, role, email? }
      isAuthenticated: false,

      // ── Actions ──

      /**
       * Called after successful login/register.
       * Stores the JWT token and decodes user info from it.
       * @param {string} token - JWT token from backend
       * @param {object} user - User object from backend response (has more fields than JWT)
       */
      setAuth: (token, user) => {
        let decoded = null;
        try {
          decoded = jwtDecode(token);
        } catch {
          console.error('Failed to decode JWT token');
        }

        set({
          token,
          user: {
            id: user?.id || decoded?.id,
            username: user?.username || decoded?.username,
            email: user?.email,
            role: user?.role || decoded?.role,
          },
          isAuthenticated: true,
        });
      },

      /**
       * Clears all auth state and removes persisted data.
       */
      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },

      /**
       * Updates the stored user profile data (e.g., after profile edit).
       * @param {object} updates - Partial user fields to merge
       */
      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },

      /**
       * Checks whether the token is still valid (not expired).
       * @returns {boolean}
       */
      isTokenValid: () => {
        const token = get().token;
        if (!token) return false;

        try {
          const decoded = jwtDecode(token);
          // JWT exp is in seconds, Date.now() is in milliseconds
          return decoded.exp * 1000 > Date.now();
        } catch {
          return false;
        }
      },

      /**
       * Returns the user's role from the stored user object.
       * @returns {'ADMIN' | 'TRAINER' | 'MEMBER' | null}
       */
      getRole: () => {
        return get().user?.role || null;
      },
    }),
    {
      name: 'gym-auth-storage', // localStorage key
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
