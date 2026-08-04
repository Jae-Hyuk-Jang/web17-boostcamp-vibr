import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { renderHook, waitFor } from '@testing-library/react';

import PlaylistDetailModal from '@/components/modals/PlaylistDetailModal/PlaylistDetailModal';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { createTestQueryClient, createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';
import { usePlaylistRecommendations } from './usePlaylistRecommendations';
import type { GetPlaylistDetailResDto, MusicResponseDto } from '@repo/dto';

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/api', () => ({
  changeMusicOrderOfPlaylist: jest.fn(),
  addMusicsToPlaylist: jest.fn(),
  deletePlaylist: jest.fn(),
  editTitleOfPlaylist: jest.fn(),
}));

jest.mock('@/api/internal', () => ({
  getAllPlaylists: jest.fn(),
  getPlaylistDetail: jest.fn(),
}));

jest.mock('@/components/search/picker/MusicPickerSearch', () => ({
  __esModule: true,
  default: () => null,
}));

const { getAllPlaylists, getPlaylistDetail } = jest.requireMock('@/api/internal') as { getAllPlaylists: jest.Mock; getPlaylistDetail: jest.Mock };

const detail: GetPlaylistDetailResDto = {
  id: 'pl-1',
  title: '내 플레이리스트',
  musics: [] as MusicResponseDto[],
};

describe('playlistDetail 캐시 공유 — PlaylistDetailModal ↔ usePlaylistRecommendations (playlist-detail-caching #195, Success Criteria)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getPlaylistDetail.mockResolvedValue(detail);
    getAllPlaylists.mockResolvedValue([]);
  });

  it('모달에서 먼저 상세를 연 뒤, 위젯에서 같은 playlistId를 선택하면 getPlaylistDetail이 재호출되지 않는다', async () => {
    const queryClient = createTestQueryClient();

    // 1) PlaylistDetailModal이 pl-1 상세를 연다
    useModalStore.setState({ isOpen: true, modalType: MODAL_TYPES.PLAYLIST_DETAIL, modalProps: {} });
    const { unmount } = render(<PlaylistDetailModal playlistId="pl-1" />, { wrapper: createQueryClientWrapper(queryClient) });
    await screen.findByText('내 플레이리스트');
    expect(getPlaylistDetail).toHaveBeenCalledTimes(1);
    unmount();

    // 2) 곡 검색 위젯(usePlaylistRecommendations)이 같은 pl-1을 선택한다 — 캐시를 공유하므로 재요청이 생략된다
    const { result } = renderHook(() => usePlaylistRecommendations({ enabled: true }), { wrapper: createQueryClientWrapper(queryClient) });
    await waitFor(() => expect(result.current.status).toBe('success'));

    let selected: unknown;
    await act(async () => {
      selected = await result.current.selectPlaylist('pl-1');
    });

    expect(selected).toEqual({ id: 'pl-1', title: '내 플레이리스트', musics: [] });
    expect(getPlaylistDetail).toHaveBeenCalledTimes(1); // 여전히 1회 — 캐시 재사용
  });

  it('반대 순서(위젯 먼저 → 모달)에서도 캐시를 공유한다', async () => {
    const queryClient = createTestQueryClient();

    // 1) 위젯에서 먼저 pl-1을 선택한다
    const { result } = renderHook(() => usePlaylistRecommendations({ enabled: true }), { wrapper: createQueryClientWrapper(queryClient) });
    await waitFor(() => expect(result.current.status).toBe('success'));
    await act(async () => {
      await result.current.selectPlaylist('pl-1');
    });
    expect(getPlaylistDetail).toHaveBeenCalledTimes(1);

    // 2) 같은 playlistId로 모달을 연다 — 재요청 없이 캐시를 그대로 쓴다
    useModalStore.setState({ isOpen: true, modalType: MODAL_TYPES.PLAYLIST_DETAIL, modalProps: {} });
    render(<PlaylistDetailModal playlistId="pl-1" />, { wrapper: createQueryClientWrapper(queryClient) });
    await screen.findByText('내 플레이리스트');

    expect(getPlaylistDetail).toHaveBeenCalledTimes(1);
  });
});
