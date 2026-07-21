import { render, screen, fireEvent } from '@testing-library/react';

import { SearchDropdown } from './SearchDropdown';
import type { MusicResponseDto as Music } from '@repo/dto';

const mockSong: Music = {
  id: 's1',
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
    useItunesSearch: jest.fn(() => ({ status: 'success', results: [mockSong], errorMessage: null, trimmedQuery: 'song' })),
    useYoutubeSearch: jest.fn(() => ({ status: 'idle', results: [], errorMessage: null, trimmedQuery: '' })),
  };
});

describe('SearchDropdown — 특성화 테스트 (search-widget-duplication #111)', () => {
  it('결과 클릭 시 handleAddSong에 { ...song, id: undefined }를 전달한다', () => {
    const handleAddSong = jest.fn();
    render(<SearchDropdown handleAddSong={handleAddSong} />);

    fireEvent.change(screen.getByPlaceholderText('추가할 음악 검색...'), { target: { value: 'song' } });
    fireEvent.click(screen.getByText('Song A'));

    expect(handleAddSong).toHaveBeenCalledWith({ ...mockSong, id: undefined });
  });

  it("'사용자' 검색 탭은 렌더링하지 않는다", () => {
    render(<SearchDropdown handleAddSong={jest.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('추가할 음악 검색...'), { target: { value: 'song' } });

    expect(screen.queryByRole('button', { name: '사용자' })).not.toBeInTheDocument();
  });
});
