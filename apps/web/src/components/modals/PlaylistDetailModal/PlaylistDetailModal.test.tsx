import { render, fireEvent } from '@testing-library/react';

import PlaylistDetailModal from './PlaylistDetailModal';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';

jest.mock('@/api', () => ({
  getPlaylistDetail: jest.fn(),
  changeMusicOrderOfPlaylist: jest.fn(),
  addMusicsToPlaylist: jest.fn(),
  deletePlaylist: jest.fn(),
  editTitleOfPlaylist: jest.fn(),
}));

jest.mock('./components', () => ({
  Header: () => <div data-testid="header" />,
  Toolbar: () => <div data-testid="toolbar" />,
  SongList: () => <div data-testid="song-list" />,
}));

const { getPlaylistDetail } = jest.requireMock('@/api') as { getPlaylistDetail: jest.Mock };

describe('PlaylistDetailModal — 배경 클릭 특성화 테스트 (#66)', () => {
  beforeEach(() => {
    useModalStore.setState({ isOpen: true, modalType: MODAL_TYPES.PLAYLIST_DETAIL, modalProps: {} });
    getPlaylistDetail.mockResolvedValue({ id: 'pl-1', title: '내 플레이리스트', musics: [] });
  });

  it('배경을 클릭하면 모달이 닫힌다', async () => {
    const { container, findByTestId } = render(<PlaylistDetailModal playlistId="pl-1" />, { wrapper: createQueryClientWrapper() });
    await findByTestId('header');

    fireEvent.mouseDown(container.firstChild as HTMLElement);

    expect(useModalStore.getState().isOpen).toBe(false);
  });
});
