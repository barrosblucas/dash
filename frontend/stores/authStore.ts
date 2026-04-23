'use client';

import { create } from 'zustand';

import type { AuthSessionPayload } from '@/types/identity';
import { apiClient } from '@/services/api';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthStore {
  initialized: boolean;
  status: AuthStatus;
  session: AuthSessionPayload | null;
  setLoading: () => void;
  setSession: (session: AuthSessionPayload) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  initialized: false,
  status: 'loading',
  session: null,
  setLoading: () => set({ status: 'loading' }),
  setSession: (session) => {
    apiClient.setAccessToken(session.access_token);
    set({ initialized: true, status: 'authenticated', session });
  },
  clearSession: () => {
    apiClient.clearAccessToken();
    set({ initialized: true, status: 'unauthenticated', session: null });
  },
}));
