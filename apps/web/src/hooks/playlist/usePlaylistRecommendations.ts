'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import type { GetAllPlaylistsResDto, GetPlaylistDetailResDto } from '@repo/dto';
import { getPlaylistDetail } from '@/api/internal';
import { MOCK_PLAYLIST_BRIEFS, MOCK_PLAYLIST_DETAILS } from '@/constants';
import { usePlaylists } from './usePlaylists';
import { PLAYLIST_DETAIL_STALE_TIME_MS } from './usePlaylistDetail';
import { playlistDetailQueryKey } from '@/query-keys';

export type PlaylistBrief = GetAllPlaylistsResDto['playlists'][number];
export type PlaylistDetail = Pick<GetPlaylistDetailResDto, 'id' | 'title' | 'musics'>;

type ListStatus = 'idle' | 'loading' | 'success';

type Options = {
  /**
   * 추천 영역이 활성화될 때만 true로 넘긴다.
   * 예: "드롭다운 열림 + 검색어 없음" 상태에서만 로드
   */
  enabled: boolean;
};

type State = {
  status: ListStatus;
  briefs: PlaylistBrief[];
  errorMessage: string | null;

  isFetching: boolean;
  selectedPlaylistId: string | null;

  refetch: () => Promise<void>;
  selectPlaylist: (playlistId: string) => Promise<PlaylistDetail | null>;
};

const toListErrorMessage = (): string => '플레이리스트를 불러오지 못했습니다.';
const toDetailErrorMessage = (): string => '플레이리스트 상세를 불러오지 못했습니다.';

const FALLBACK_HINT = '플레이리스트 API 연동 전까지 목업 데이터로 대체합니다. (추후 제거)';

const toFallbackListMessage = (): string => `${toListErrorMessage()} ${FALLBACK_HINT}`;
const toFallbackDetailMessage = (): string => `${toDetailErrorMessage()} ${FALLBACK_HINT}`;

export const usePlaylistRecommendations = ({ enabled }: Options): State => {
  const query = usePlaylists(enabled);
  const queryClient = useQueryClient();

  const [detailErrorMessage, setDetailErrorMessage] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  const status: ListStatus = !enabled ? 'idle' : query.isPending ? 'loading' : 'success';
  const briefs = query.isError ? MOCK_PLAYLIST_BRIEFS : (query.data ?? []);
  const errorMessage = detailErrorMessage ?? (query.isError ? toFallbackListMessage() : null);

  const { refetch: queryRefetch } = query;
  const refetch = useCallback(async () => {
    setDetailErrorMessage(null);
    await queryRefetch();
  }, [queryRefetch]);

  // PlaylistDetailModal(#189~#193)과 같은 캐시(playlistDetailQueryKey)를 재사용한다 — 컴포넌트 마운트에
  // 종속되지 않는 사용자 액션(추천 드롭다운 선택)이므로 useQuery 대신 ensureQueryData를 쓴다.
  const selectPlaylist = useCallback(
    async (playlistId: string): Promise<PlaylistDetail | null> => {
      setSelectedPlaylistId(playlistId);

      try {
        const detail = await queryClient.ensureQueryData({
          queryKey: playlistDetailQueryKey(playlistId),
          queryFn: () => getPlaylistDetail(playlistId),
          staleTime: PLAYLIST_DETAIL_STALE_TIME_MS,
        });
        return { id: detail.id, title: detail.title, musics: detail.musics };
      } catch {
        /**
         * TODO(BE): 백엔드 연결 완료 후 아래 fallback 제거
         * - 에러 메시지 정책(토스트/재시도 버튼)을 UI에서 확정
         */
        setDetailErrorMessage(toFallbackDetailMessage());

        const fallback = MOCK_PLAYLIST_DETAILS[playlistId as keyof typeof MOCK_PLAYLIST_DETAILS];
        if (!fallback) return null;

        return { id: fallback.id, title: fallback.title, musics: fallback.musics };
      } finally {
        setSelectedPlaylistId(null);
      }
    },
    [queryClient],
  );

  return {
    status,
    briefs,
    errorMessage,
    isFetching: query.isFetching,
    selectedPlaylistId,
    refetch,
    selectPlaylist,
  };
};
