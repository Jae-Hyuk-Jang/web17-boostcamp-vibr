import { render, fireEvent, screen, waitFor, within } from '@testing-library/react';

import PlaylistDetailModal from './PlaylistDetailModal';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { createTestQueryClient, createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';
import { playlistDetailQueryKey } from '@/hooks/playlist/usePlaylistDetail';
import type { MusicResponseDto, GetPlaylistDetailResDto } from '@repo/dto';

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/api', () => ({
  changeMusicOrderOfPlaylist: jest.fn(),
  addMusicsToPlaylist: jest.fn(),
  deletePlaylist: jest.fn(),
  editTitleOfPlaylist: jest.fn(),
}));

// usePlaylistDetail(#188)이 getPlaylistDetail을 '@/api/internal'에서 직접 가져오므로 별도로 모킹한다.
jest.mock('@/api/internal', () => ({
  getPlaylistDetail: jest.fn(),
}));

jest.mock('@/components/search/picker/MusicPickerSearch', () => ({
  __esModule: true,
  default: ({ onSelect }: { onSelect: (music: MusicResponseDto) => void }) => (
    <button
      onClick={() =>
        onSelect({
          id: 'new-song',
          title: 'New Song',
          artistName: 'New Artist',
          albumCoverUrl: 'https://example.com/new.jpg',
          trackUri: 'uri-new',
          provider: 'ITUNES' as MusicResponseDto['provider'],
          durationMs: 1000,
        })
      }
    >
      곡 추가 트리거
    </button>
  ),
}));

const { changeMusicOrderOfPlaylist, addMusicsToPlaylist, deletePlaylist, editTitleOfPlaylist } = jest.requireMock('@/api') as {
  changeMusicOrderOfPlaylist: jest.Mock;
  addMusicsToPlaylist: jest.Mock;
  deletePlaylist: jest.Mock;
  editTitleOfPlaylist: jest.Mock;
};
const { getPlaylistDetail } = jest.requireMock('@/api/internal') as { getPlaylistDetail: jest.Mock };
const { toast } = jest.requireMock('react-toastify') as { toast: { error: jest.Mock } };

const song = (id: string, title: string): MusicResponseDto => ({
  id,
  title,
  artistName: 'Artist',
  albumCoverUrl: 'https://example.com/cover.jpg',
  trackUri: `uri-${id}`,
  provider: 'ITUNES' as MusicResponseDto['provider'],
  durationMs: 1000,
});

const basePlaylist: GetPlaylistDetailResDto = {
  id: 'pl-1',
  title: '내 플레이리스트',
  musics: [song('s1', 'Song1'), song('s2', 'Song2'), song('s3', 'Song3')],
};

const clonePlaylist = () => JSON.parse(JSON.stringify(basePlaylist)) as GetPlaylistDetailResDto;

const fakeDataTransfer = () => ({ setData: jest.fn(), getData: jest.fn(() => ''), effectAllowed: '', dropEffect: '' });

const renderModal = () => render(<PlaylistDetailModal playlistId="pl-1" />, { wrapper: createQueryClientWrapper() });

describe('PlaylistDetailModal — 특성화 테스트 (playlist-detail-caching #187)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useModalStore.setState({ isOpen: true, modalType: MODAL_TYPES.PLAYLIST_DETAIL, modalProps: {} });
    getPlaylistDetail.mockResolvedValue(clonePlaylist());
  });

  it('배경을 클릭하면 모달이 닫힌다 (#66)', async () => {
    const { container } = renderModal();
    await screen.findByText('내 플레이리스트');

    fireEvent.mouseDown(container.firstChild as HTMLElement);

    expect(useModalStore.getState().isOpen).toBe(false);
  });

  it('최초 마운트 시 getPlaylistDetail을 1회 호출하고 곡 목록을 렌더링한다', async () => {
    renderModal();

    await screen.findByText('내 플레이리스트');
    expect(getPlaylistDetail).toHaveBeenCalledTimes(1);
    expect(getPlaylistDetail).toHaveBeenCalledWith('pl-1');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('초기 로드 실패 시 에러 toast를 띄우고 아무것도 렌더링하지 않는다', async () => {
    getPlaylistDetail.mockRejectedValue(new Error('network error'));
    renderModal();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('플레이리스트 정보를 불러오지 못했습니다.'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('제목 편집: 유효성 검사를 통과한 새 제목으로 성공하면 즉시 반영된다', async () => {
    editTitleOfPlaylist.mockResolvedValue(undefined);
    renderModal();
    await screen.findByText('내 플레이리스트');

    fireEvent.click(screen.getByLabelText('Edit title'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '새 제목' } });
    fireEvent.click(screen.getByLabelText('Confirm rename'));

    await waitFor(() => expect(editTitleOfPlaylist).toHaveBeenCalledWith('pl-1', '새 제목'));
    expect(await screen.findByText('새 제목')).toBeInTheDocument();
  });

  it('제목 편집 성공 시 playlistDetail 캐시(다른 진입점과 공유)에도 반영된다 (playlist-detail-caching #190)', async () => {
    editTitleOfPlaylist.mockResolvedValue(undefined);
    const queryClient = createTestQueryClient();
    render(<PlaylistDetailModal playlistId="pl-1" />, { wrapper: createQueryClientWrapper(queryClient) });
    await screen.findByText('내 플레이리스트');

    fireEvent.click(screen.getByLabelText('Edit title'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '새 제목' } });
    fireEvent.click(screen.getByLabelText('Confirm rename'));

    await waitFor(() => expect(queryClient.getQueryData<GetPlaylistDetailResDto>(playlistDetailQueryKey('pl-1'))?.title).toBe('새 제목'));
  });

  it('제목 편집: MAX_PLAYLIST_TITLE_LENGTH를 넘으면 저장 없이 에러 문구를 보여준다', async () => {
    renderModal();
    await screen.findByText('내 플레이리스트');

    fireEvent.click(screen.getByLabelText('Edit title'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'a'.repeat(21) } });

    expect(await screen.findByText(/최대 20자까지 허용합니다/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Confirm rename'));
    expect(editTitleOfPlaylist).not.toHaveBeenCalled();
  });

  it('제목 편집: API 실패 시 에러 toast를 띄우고 편집 모드를 유지한다', async () => {
    editTitleOfPlaylist.mockRejectedValue(new Error('fail'));
    renderModal();
    await screen.findByText('내 플레이리스트');

    fireEvent.click(screen.getByLabelText('Edit title'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '새 제목' } });
    fireEvent.click(screen.getByLabelText('Confirm rename'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('플레이리스트 이름 변경에 실패했습니다.'));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('곡 순서 변경: 위로 이동 버튼을 누르면 즉시 로컬 순서가 바뀌고 API를 호출한다', async () => {
    changeMusicOrderOfPlaylist.mockResolvedValue(undefined);
    renderModal();
    await screen.findByText('내 플레이리스트');

    const items = screen.getAllByRole('listitem');
    const secondItemButtons = within(items[1]!).getAllByRole('button');
    fireEvent.click(secondItemButtons[1]!); // Song2의 ChevronUp

    // 낙관적 업데이트: API 응답 전에 이미 순서가 바뀐다
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Song2');
    await waitFor(() => expect(changeMusicOrderOfPlaylist).toHaveBeenCalledWith('pl-1', ['s2', 's1', 's3']));
  });

  it('곡 순서 변경: onMutate에서 즉시 playlistDetail 캐시도 낙관적으로 반영된다 (playlist-detail-caching #191)', async () => {
    changeMusicOrderOfPlaylist.mockResolvedValue(undefined);
    const queryClient = createTestQueryClient();
    render(<PlaylistDetailModal playlistId="pl-1" />, { wrapper: createQueryClientWrapper(queryClient) });
    await screen.findByText('내 플레이리스트');

    const items = screen.getAllByRole('listitem');
    const secondItemButtons = within(items[1]!).getAllByRole('button');
    fireEvent.click(secondItemButtons[1]!); // Song2의 ChevronUp

    expect(queryClient.getQueryData<GetPlaylistDetailResDto>(playlistDetailQueryKey('pl-1'))?.musics.map((m) => m.id)).toEqual(['s2', 's1', 's3']);
  });

  it('곡 순서 변경 실패 시 에러 toast를 띄우지만, 낙관적으로 바뀐 로컬 순서는 롤백하지 않는다 (현재 동작)', async () => {
    changeMusicOrderOfPlaylist.mockRejectedValue(new Error('fail'));
    renderModal();
    await screen.findByText('내 플레이리스트');

    const items = screen.getAllByRole('listitem');
    const secondItemButtons = within(items[1]!).getAllByRole('button');
    fireEvent.click(secondItemButtons[1]!); // Song2의 ChevronUp

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('변경사항 반영에 실패했습니다.'));
    // 롤백이 없다 — Song2가 여전히 맨 앞에 남아있다
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Song2');
  });

  it('드래그로 곡 순서를 옮기면(moveSongTo) API를 호출한다', async () => {
    changeMusicOrderOfPlaylist.mockResolvedValue(undefined);
    renderModal();
    await screen.findByText('내 플레이리스트');

    const items = screen.getAllByRole('listitem');
    fireEvent.dragStart(items[0]!, { dataTransfer: fakeDataTransfer() });
    fireEvent.dragOver(items[2]!, { dataTransfer: fakeDataTransfer() });
    fireEvent.drop(items[2]!, { dataTransfer: fakeDataTransfer() });

    await waitFor(() => expect(changeMusicOrderOfPlaylist).toHaveBeenCalledWith('pl-1', ['s2', 's3', 's1']));
  });

  it('곡 선택 후 삭제하면(deleteSelectedSongs) 즉시 목록에서 사라지고 API를 호출한다', async () => {
    changeMusicOrderOfPlaylist.mockResolvedValue(undefined);
    renderModal();
    await screen.findByText('내 플레이리스트');

    const items = screen.getAllByRole('listitem');
    const checkbox = within(items[0]!).getAllByRole('button')[0]!; // Song1 체크박스
    fireEvent.click(checkbox);

    fireEvent.click(screen.getByText('삭제하기'));

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    await waitFor(() => expect(changeMusicOrderOfPlaylist).toHaveBeenCalledWith('pl-1', ['s2', 's3']));
  });

  it('곡 추가: 낙관적 업데이트 없이 API 성공 응답을 받은 뒤에만 목록에 반영된다', async () => {
    addMusicsToPlaylist.mockResolvedValue({ addedMusics: [song('new-song', 'New Song')] });
    renderModal();
    await screen.findByText('내 플레이리스트');

    fireEvent.click(screen.getByText('곡 추가 트리거'));

    // 검색 결과의 id는 onSelect 호출부에서 undefined로 지워진 뒤(UnsavedMusic) 서버로 전달된다
    await waitFor(() => expect(addMusicsToPlaylist).toHaveBeenCalledWith('pl-1', [expect.objectContaining({ title: 'New Song', id: undefined })]));
    expect(await screen.findByText('New Song')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('곡 추가 실패 시 에러 toast를 띄우고 목록은 바뀌지 않는다', async () => {
    addMusicsToPlaylist.mockRejectedValue(new Error('fail'));
    renderModal();
    await screen.findByText('내 플레이리스트');

    fireEvent.click(screen.getByText('곡 추가 트리거'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('곡 추가에 실패했습니다.'));
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('삭제 확인 오버레이: 취소를 누르면 플레이리스트가 삭제되지 않는다', async () => {
    renderModal();
    await screen.findByText('내 플레이리스트');

    fireEvent.click(screen.getByLabelText('Delete playlist'));
    expect(await screen.findByText('플레이리스트를 삭제할까요?')).toBeInTheDocument();

    fireEvent.click(screen.getByText('취소'));
    expect(deletePlaylist).not.toHaveBeenCalled();
    expect(screen.getByText('내 플레이리스트')).toBeInTheDocument();
  });

  it('삭제 확인 오버레이: 확인을 누르면 삭제 API를 호출하고 모달을 닫는다', async () => {
    deletePlaylist.mockResolvedValue(undefined);
    renderModal();
    await screen.findByText('내 플레이리스트');

    fireEvent.click(screen.getByLabelText('Delete playlist'));
    fireEvent.click(await screen.findByText('삭제'));

    await waitFor(() => expect(deletePlaylist).toHaveBeenCalledWith('pl-1'));
    await waitFor(() => expect(useModalStore.getState().isOpen).toBe(false));
  });

  it('삭제 API 실패 시 에러 toast를 띄우고 모달은 닫히지 않는다', async () => {
    deletePlaylist.mockRejectedValue(new Error('fail'));
    renderModal();
    await screen.findByText('내 플레이리스트');

    fireEvent.click(screen.getByLabelText('Delete playlist'));
    fireEvent.click(await screen.findByText('삭제'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('플레이리스트 삭제에 실패했습니다.'));
    expect(useModalStore.getState().isOpen).toBe(true);
  });
});
