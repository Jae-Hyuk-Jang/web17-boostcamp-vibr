import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import PlaylistPickerModal from './PlaylistPickerModal';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import type { MusicResponseDto as Music } from '@repo/dto';

jest.mock('@/api', () => ({
  getAllPlaylists: jest.fn(),
  addMusicsToPlaylist: jest.fn(),
  createNewPlaylist: jest.fn(),
}));

const { getAllPlaylists } = jest.requireMock('@/api') as { getAllPlaylists: jest.Mock };

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
    render(<PlaylistPickerModal />);
    await waitFor(() => expect(getAllPlaylists).toHaveBeenCalled());
    await screen.findByText('플레이리스트가 없습니다.');

    fireEvent.mouseDown(screen.getByRole('dialog'));

    expect(useModalStore.getState().isOpen).toBe(false);
  });

  it('닫기 버튼을 클릭하면 모달이 닫힌다', async () => {
    render(<PlaylistPickerModal />);
    await waitFor(() => expect(getAllPlaylists).toHaveBeenCalled());
    await screen.findByText('플레이리스트가 없습니다.');

    fireEvent.click(screen.getAllByRole('button')[0]!);

    expect(useModalStore.getState().isOpen).toBe(false);
  });
});
