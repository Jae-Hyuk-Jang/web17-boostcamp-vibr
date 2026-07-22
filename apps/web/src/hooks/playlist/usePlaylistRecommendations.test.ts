import { renderHook, waitFor } from '@testing-library/react';

import { usePlaylistRecommendations } from './usePlaylistRecommendations';
import { PLAYLISTS_QUERY_KEY } from './usePlaylists';
import { MOCK_PLAYLIST_BRIEFS } from '@/constants';
import { createTestQueryClient, createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';

jest.mock('@/api/internal', () => ({
  getAllPlaylists: jest.fn(),
  getPlaylistDetail: jest.fn(),
}));

const { getAllPlaylists } = jest.requireMock('@/api/internal') as { getAllPlaylists: jest.Mock };

describe('usePlaylistRecommendations — 플레이리스트 추천 위젯 특성화·계약 테스트 (#139)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enabled: true로 마운트되면 getAllPlaylists를 1회 호출하고 결과를 briefs에 반영한다', async () => {
    getAllPlaylists.mockResolvedValue([{ id: 'p1', title: 'p1', tracksCount: 1, firstAlbumCoverUrl: '' }]);

    const { result } = renderHook(() => usePlaylistRecommendations({ enabled: true }), { wrapper: createQueryClientWrapper() });

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(getAllPlaylists).toHaveBeenCalledTimes(1);
    expect(result.current.briefs).toEqual([{ id: 'p1', title: 'p1', tracksCount: 1, firstAlbumCoverUrl: '' }]);
    expect(result.current.errorMessage).toBeNull();
  });

  it('getAllPlaylists 실패 시 MOCK_PLAYLIST_BRIEFS로 폴백하고 안내 메시지를 채운다', async () => {
    getAllPlaylists.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => usePlaylistRecommendations({ enabled: true }), { wrapper: createQueryClientWrapper() });

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.briefs).toEqual(MOCK_PLAYLIST_BRIEFS);
    expect(result.current.errorMessage).toContain('목업 데이터로 대체');
  });

  it('[이슈 1 재현 테스트 통과 전환 — #139] 다른 화면(ArchiveView 등)이 플레이리스트 캐시를 무효화하면 자동으로 재조회된다', async () => {
    const queryClient = createTestQueryClient();
    getAllPlaylists.mockResolvedValue([]);

    const { result } = renderHook(() => usePlaylistRecommendations({ enabled: true }), {
      wrapper: createQueryClientWrapper(queryClient),
    });
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(getAllPlaylists).toHaveBeenCalledTimes(1);

    getAllPlaylists.mockResolvedValue([{ id: 'p2', title: 'p2', tracksCount: 2, firstAlbumCoverUrl: '' }]);

    // ArchiveView/ArchiveViewHeader/PlaylistDetailModal이 변경 후 실제로 호출하는 것과 동일한 무효화 신호
    await queryClient.invalidateQueries({ queryKey: PLAYLISTS_QUERY_KEY });

    await waitFor(() => expect(getAllPlaylists).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.briefs).toEqual([{ id: 'p2', title: 'p2', tracksCount: 2, firstAlbumCoverUrl: '' }]));
  });
});
