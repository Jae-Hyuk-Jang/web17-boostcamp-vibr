'use client';

import { useQuery } from '@tanstack/react-query';

import { getUser } from '@/api/internal';

// 세션 중 잦은 변경 대상이 아니므로, 같은 userId를 다른 진입점에서 다시 열어도 이 시간 내에는
// 캐시를 그대로 재사용한다(불필요한 재요청 방지). usePlaylistDetail/usePostDetail과 동일한 근거로
// 같은 값을 쓴다.
export const PROFILE_STALE_TIME_MS = 60 * 1000;

export const profileQueryKey = (userId: string) => ['profile', userId] as const;

export const useProfile = (userId: string, enabled: boolean = true) =>
  useQuery({
    queryKey: profileQueryKey(userId),
    queryFn: () => getUser(userId),
    enabled: enabled && Boolean(userId),
    staleTime: PROFILE_STALE_TIME_MS,
  });
