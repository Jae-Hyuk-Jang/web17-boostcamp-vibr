'use client';

import { useQuery } from '@tanstack/react-query';

import { authMe } from '@/api/internal/auth';
import { AUTH_ME_QUERY_KEY } from '@/query-keys';

// staleTime을 두지 않으면(기본값 0) usePostReactions가 게시글 상세를 열 때마다 쿼리 옵저버가
// 새로 mount되어 매번 재요청한다 — AuthBootstrap이 이미 채워둔 캐시를 히트하게 하려면 필요.
const AUTH_ME_STALE_TIME_MS = 5 * 60 * 1000;

export const useAuthMeQuery = (enabled: boolean = true) =>
  useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: authMe,
    enabled,
    retry: false,
    staleTime: AUTH_ME_STALE_TIME_MS,
  });
