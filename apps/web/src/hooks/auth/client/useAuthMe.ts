'use client';

import { useEffect, useState } from 'react';
import { authMe } from '@/api';

type AuthMeState = {
  userId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

export function useAuthMe(): AuthMeState {
  const [state, setState] = useState<AuthMeState>({
    userId: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    let isAlive = true;

    (async () => {
      try {
        const data = await authMe();
        if (!isAlive) return;
        setState({ userId: data.id, isAuthenticated: true, isLoading: false });
      } catch {
        if (!isAlive) return;
        setState({ userId: null, isAuthenticated: false, isLoading: false });
      }
    })();

    return () => {
      isAlive = false;
    };
  }, []);

  return state;
}
