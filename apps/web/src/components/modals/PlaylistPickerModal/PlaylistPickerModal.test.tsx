import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import PlaylistPickerModal from './PlaylistPickerModal';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { PLAYLISTS_QUERY_KEY } from '@/query-keys';
import { createTestQueryClient, createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';
import type { MusicResponseDto as Music } from '@repo/dto';

jest.mock('@/api', () => ({
  addMusicsToPlaylist: jest.fn(),
  createNewPlaylist: jest.fn(),
}));

jest.mock('@/api/internal', () => ({
  getAllPlaylists: jest.fn(),
}));

const { getAllPlaylists } = jest.requireMock('@/api/internal') as { getAllPlaylists: jest.Mock };

const mockMusic: Music = {
  id: 'music-1',
  trackUri: 'uri-1',
  provider: 'SPOTIFY' as Music['provider'],
  albumCoverUrl: '',
  title: 'Song',
  artistName: 'Artist',
  durationMs: 180000,
};

describe('PlaylistPickerModal — 배경 클릭/닫기 버튼 특성화 테스트 (#66)', () => {
  beforeEach(() => {
    getAllPlaylists.mockResolvedValue([]);
    useModalStore.setState({ isOpen: true, modalType: MODAL_TYPES.PLAYLIST_PICKER, modalProps: { musics: [mockMusic] } });
  });

  it('배경을 클릭하면 모달이 닫힌다', async () => {
    // #68: 별도 overlay div가 ModalShell로 흡수되어, backdrop이 곧 role="dialog" 요소다.
    render(<PlaylistPickerModal />, { wrapper: createQueryClientWrapper() });
    await waitFor(() => expect(getAllPlaylists).toHaveBeenCalled());
    await screen.findByText('플레이리스트가 없습니다.');

    fireEvent.mouseDown(screen.getByRole('dialog'));

    expect(useModalStore.getState().isOpen).toBe(false);
  });

  it('닫기 버튼을 클릭하면 모달이 닫힌다', async () => {
    render(<PlaylistPickerModal />, { wrapper: createQueryClientWrapper() });
    await waitFor(() => expect(getAllPlaylists).toHaveBeenCalled());
    await screen.findByText('플레이리스트가 없습니다.');

    fireEvent.click(screen.getAllByRole('button')[0]!);

    expect(useModalStore.getState().isOpen).toBe(false);
  });
});

describe('PlaylistPickerModal — usePlaylists(TanStack Query) 구독 계약 테스트 (#139)', () => {
  beforeEach(() => {
    getAllPlaylists.mockClear();
    getAllPlaylists.mockResolvedValue([]);
    useModalStore.setState({ isOpen: true, modalType: MODAL_TYPES.PLAYLIST_PICKER, modalProps: { musics: [mockMusic] } });
  });

  it('[이슈 1의 비대칭 특성화가 이슈 3 전환으로 해소됨] 공유 캐시(["playlists"])가 무효화되면 모달이 열려있는 동안에도 목록을 다시 불러온다', async () => {
    const queryClient = createTestQueryClient();
    render(<PlaylistPickerModal />, { wrapper: createQueryClientWrapper(queryClient) });
    await waitFor(() => expect(getAllPlaylists).toHaveBeenCalledTimes(1));

    await queryClient.invalidateQueries({ queryKey: PLAYLISTS_QUERY_KEY });

    await waitFor(() => expect(getAllPlaylists).toHaveBeenCalledTimes(2));
  });
});
