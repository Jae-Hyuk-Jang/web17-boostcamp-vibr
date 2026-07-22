'use client';

import { useAuthMeQuery } from './useAuthMeQuery';

type AuthMeState = {
  userId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

export function useAuthMe(): AuthMeState {
  const { data, isPending, isError } = useAuthMeQuery();

  if (isPending) return { userId: null, isAuthenticated: false, isLoading: true };
  if (isError || !data) return { userId: null, isAuthenticated: false, isLoading: false };
  return { userId: data.id, isAuthenticated: true, isLoading: false };
}
