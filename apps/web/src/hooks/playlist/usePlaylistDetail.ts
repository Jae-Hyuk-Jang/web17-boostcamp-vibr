'use client';

import { useQuery } from '@tanstack/react-query';

import { getPlaylistDetail } from '@/api/internal';

// 세션 중 잦은 재편집 대상이 아니므로, 같은 playlistId를 다른 진입점(상세 모달/추천 위젯)에서
// 다시 열어도 이 시간 내에는 캐시를 그대로 재사용한다(불필요한 재요청 방지). usePostDetail의
// POST_DETAIL_STALE_TIME_MS와 동일한 근거로 같은 값을 쓴다.
export const PLAYLIST_DETAIL_STALE_TIME_MS = 60 * 1000;

export const playlistDetailQueryKey = (playlistId: string) => ['playlistDetail', playlistId] as const;

export const usePlaylistDetail = (playlistId: string, enabled: boolean = true) =>
  useQuery({
    queryKey: playlistDetailQueryKey(playlistId),
    queryFn: () => getPlaylistDetail(playlistId),
    enabled: enabled && Boolean(playlistId),
    staleTime: PLAYLIST_DETAIL_STALE_TIME_MS,
  });
