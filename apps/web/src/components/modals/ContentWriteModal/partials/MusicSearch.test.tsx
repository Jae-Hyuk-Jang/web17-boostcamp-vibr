import { render, screen, fireEvent } from '@testing-library/react';

import { MusicSearch } from './MusicSearch';
import type { MusicResponseDto as Music } from '@repo/dto';

const mockMusic: Music = {
  id: 'm1',
  trackUri: 'uri-1',
  provider: 'ITUNES' as Music['provider'],
  albumCoverUrl: 'https://example.com/a.jpg',
  title: 'Song A',
  artistName: 'Artist A',
  durationMs: 200000,
};

jest.mock('@/hooks', () => {
  const actual = jest.requireActual('@/hooks');
  return {
    ...actual,
    useItunesSearch: jest.fn(() => ({ status: 'success', results: [mockMusic], errorMessage: null, trimmedQuery: 'song' })),
    useYoutubeSearch: jest.fn(() => ({ status: 'idle', results: [], errorMessage: null, trimmedQuery: '' })),
    usePlaylistRecommendations: jest.fn(() => ({
      status: 'idle',
      briefs: [],
      errorMessage: null,
      isFetching: false,
      selectedPlaylistId: null,
      refetch: jest.fn(),
      selectPlaylist: jest.fn(),
    })),
  };
});

describe('MusicSearch — 특성화 테스트 (search-widget-duplication #111)', () => {
  const baseProps = {
    searchQuery: 'song',
    setSearchQuery: jest.fn(),
    isSearchOpen: true,
    setIsSearchOpen: jest.fn(),
    onAddMusic: jest.fn(),
    onAddPlaylist: jest.fn(),
  };

  it('결과 클릭 시 onAddMusic에 원본 Music 객체를 변환 없이 그대로 전달한다', () => {
    render(<MusicSearch {...baseProps} />);

    fireEvent.click(screen.getByText('Song A'));

    expect(baseProps.onAddMusic).toHaveBeenCalledWith(mockMusic);
  });

  it("'사용자' 검색 탭은 렌더링하지 않는다", () => {
    render(<MusicSearch {...baseProps} />);

    expect(screen.queryByRole('button', { name: '사용자' })).not.toBeInTheDocument();
  });
});
