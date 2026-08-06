import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import PlaylistPickerModal from './PlaylistPickerModal';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { PLAYLISTS_QUERY_KEY, playlistDetailQueryKey } from '@/query-keys';
import { createTestQueryClient, createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';
import type { MusicResponseDto as Music, PlaylistBriefResDto } from '@repo/dto';

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

jest.mock('@/api', () => ({
  addMusicsToPlaylist: jest.fn(),
  createNewPlaylist: jest.fn(),
}));

jest.mock('@/api/internal', () => ({
  getAllPlaylists: jest.fn(),
}));

const { addMusicsToPlaylist, createNewPlaylist } = jest.requireMock('@/api') as {
  addMusicsToPlaylist: jest.Mock;
  createNewPlaylist: jest.Mock;
};
const { getAllPlaylists } = jest.requireMock('@/api/internal') as { getAllPlaylists: jest.Mock };
const { toast } = jest.requireMock('react-toastify') as { toast: { success: jest.Mock; error: jest.Mock; info: jest.Mock } };

const mockMusic: Music = {
  id: 'music-1',
  trackUri: 'uri-1',
  provider: 'YOUTUBE' as Music['provider'],
  albumCoverUrl: '',
  title: 'Song',
  artistName: 'Artist',
  durationMs: 180000,
};

const mockPlaylist = (overrides: Partial<PlaylistBriefResDto> = {}): PlaylistBriefResDto => ({
  id: 'pl-1',
  title: '내 플레이리스트',
  tracksCount: 3,
  firstAlbumCoverUrl: 'https://example.com/cover.jpg',
  ...overrides,
});

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

describe('PlaylistPickerModal — 저장/생성 경로 특성화 (playlist-picker-cache-sync #288)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAllPlaylists.mockResolvedValue([mockPlaylist()]);
    useModalStore.setState({ isOpen: true, modalType: MODAL_TYPES.PLAYLIST_PICKER, modalProps: { musics: [mockMusic] } });
  });

  it('저장 성공(신규 곡): 성공 toast를 띄우고 모달을 닫는다', async () => {
    addMusicsToPlaylist.mockResolvedValue({ addedMusics: [mockMusic] });
    render(<PlaylistPickerModal />, { wrapper: createQueryClientWrapper() });
    await screen.findByRole('button', { name: /내 플레이리스트/ });

    fireEvent.click(screen.getByRole('button', { name: /내 플레이리스트/ }));

    await waitFor(() => expect(addMusicsToPlaylist).toHaveBeenCalledWith('pl-1', expect.any(Array)));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('보관함에 저장했어요.'));
    expect(useModalStore.getState().isOpen).toBe(false);
  });

  it('저장 성공(중복 곡, addedMusics 빈 배열): 안내 toast를 띄운다', async () => {
    addMusicsToPlaylist.mockResolvedValue({ addedMusics: [] });
    render(<PlaylistPickerModal />, { wrapper: createQueryClientWrapper() });
    await screen.findByRole('button', { name: /내 플레이리스트/ });

    fireEvent.click(screen.getByRole('button', { name: /내 플레이리스트/ }));

    await waitFor(() => expect(toast.info).toHaveBeenCalledWith('이미 플레이리스트에 있는 곡이에요.'));
  });

  it('저장 실패: 에러 toast를 띄우고 모달을 유지한다', async () => {
    addMusicsToPlaylist.mockRejectedValue(new Error('fail'));
    render(<PlaylistPickerModal />, { wrapper: createQueryClientWrapper() });
    await screen.findByRole('button', { name: /내 플레이리스트/ });

    fireEvent.click(screen.getByRole('button', { name: /내 플레이리스트/ }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('저장에 실패했습니다.'));
    expect(useModalStore.getState().isOpen).toBe(true);
  });

  it('생성+저장 성공: 새 플레이리스트를 만든 뒤 그 id로 저장한다', async () => {
    createNewPlaylist.mockResolvedValue({ id: 'pl-new', title: '새 플레이리스트' });
    addMusicsToPlaylist.mockResolvedValue({ addedMusics: [mockMusic] });
    render(<PlaylistPickerModal />, { wrapper: createQueryClientWrapper() });
    await screen.findByText('새 플레이리스트 만들고 저장');

    fireEvent.click(screen.getByText('새 플레이리스트 만들고 저장'));

    await waitFor(() => expect(createNewPlaylist).toHaveBeenCalled());
    await waitFor(() => expect(addMusicsToPlaylist).toHaveBeenCalledWith('pl-new', expect.any(Array)));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('보관함에 저장했어요.'));
    expect(useModalStore.getState().isOpen).toBe(false);
  });

  it('생성 실패: 에러 toast를 띄우고 저장은 시도하지 않는다', async () => {
    createNewPlaylist.mockRejectedValue(new Error('fail'));
    render(<PlaylistPickerModal />, { wrapper: createQueryClientWrapper() });
    await screen.findByText('새 플레이리스트 만들고 저장');

    fireEvent.click(screen.getByText('새 플레이리스트 만들고 저장'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('플레이리스트 생성에 실패했습니다.'));
    expect(addMusicsToPlaylist).not.toHaveBeenCalled();
  });

  it('저장이 진행 중일 때 같은 플레이리스트를 다시 클릭해도 중복 호출되지 않는다', async () => {
    let resolveAdd!: (value: unknown) => void;
    addMusicsToPlaylist.mockReturnValue(
      new Promise((resolve) => {
        resolveAdd = resolve;
      }),
    );
    render(<PlaylistPickerModal />, { wrapper: createQueryClientWrapper() });
    const button = await screen.findByRole('button', { name: /내 플레이리스트/ });

    fireEvent.click(button);
    fireEvent.click(button);

    // useMutation의 mutationFn 호출은 mutate 직후 동기적으로 일어나지 않으므로(react-query 내부
    // 디스패치를 거침) waitFor로 확인한다 — 두 번째 클릭이 무시된다는 사실 자체는 최종 호출 횟수가
    // 1회로 유지되는 것으로 여전히 보장된다.
    await waitFor(() => expect(addMusicsToPlaylist).toHaveBeenCalledTimes(1));

    resolveAdd({ addedMusics: [mockMusic] });
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it('저장 성공 시 playlistDetail 캐시에 반영되고 playlists 캐시가 무효화된다 (playlist-picker-cache-sync #289, #284 버그 수정 확인)', async () => {
    addMusicsToPlaylist.mockResolvedValue({ addedMusics: [mockMusic] });
    const queryClient = createTestQueryClient();
    // 이미 열려 있는 PlaylistDetailModal이 이 캐시를 구독 중인 상황을 시뮬레이션한다.
    queryClient.setQueryData(playlistDetailQueryKey('pl-1'), { id: 'pl-1', title: '내 플레이리스트', musics: [] });
    render(<PlaylistPickerModal />, { wrapper: createQueryClientWrapper(queryClient) });
    await screen.findByRole('button', { name: /내 플레이리스트/ });

    fireEvent.click(screen.getByRole('button', { name: /내 플레이리스트/ }));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());

    expect(queryClient.getQueryData(playlistDetailQueryKey('pl-1'))).toMatchObject({ musics: [mockMusic] });
    await waitFor(() => expect(getAllPlaylists).toHaveBeenCalledTimes(2)); // invalidate로 재조회됨
  });
});
