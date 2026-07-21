import { render, screen, fireEvent } from '@testing-library/react';

import MusicPickerSearch from './MusicPickerSearch';
import type { MusicResponseDto as Music } from '@repo/dto';

const mockTrack: Music = {
  id: 'm1',
  trackUri: 'uri-1',
  provider: 'ITUNES' as Music['provider'],
  albumCoverUrl: 'https://example.com/a.jpg',
  title: 'Music Result',
  artistName: 'Artist A',
  durationMs: 200000,
};

const mockVideo: Music = {
  id: 'v1',
  trackUri: 'uri-2',
  provider: 'YOUTUBE' as Music['provider'],
  albumCoverUrl: 'https://example.com/b.jpg',
  title: 'Video Result',
  artistName: 'Artist B',
  durationMs: 180000,
};

jest.mock('@/hooks', () => {
  const actual = jest.requireActual('@/hooks');
  return {
    ...actual,
    useItunesSearch: jest.fn(() => ({ status: 'success', results: [mockTrack], errorMessage: null, trimmedQuery: 'song' })),
    useYoutubeSearch: jest.fn(() => ({ status: 'success', results: [mockVideo], errorMessage: null, trimmedQuery: 'song' })),
  };
});

describe('MusicPickerSearch — 계약/상태전이 테스트 (search-widget-duplication #112)', () => {
  it('query가 비어 있으면 탭/결과 영역을 렌더링하지 않는다', () => {
    render(<MusicPickerSearch query="" onQueryChange={jest.fn()} onSelect={jest.fn()} />);

    expect(screen.queryByRole('button', { name: '음원' })).not.toBeInTheDocument();
    expect(screen.queryByText('Music Result')).not.toBeInTheDocument();
  });

  it('query가 있으면 기본 탭(음원) 결과가 노출된다', () => {
    render(<MusicPickerSearch query="song" onQueryChange={jest.fn()} onSelect={jest.fn()} />);

    expect(screen.getByText('Music Result')).toBeInTheDocument();
    expect(screen.queryByText('Video Result')).not.toBeInTheDocument();
  });

  it('유튜브 탭으로 전환하면 유튜브 결과만 노출된다', () => {
    render(<MusicPickerSearch query="song" onQueryChange={jest.fn()} onSelect={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '유튜브' }));

    expect(screen.getByText('Video Result')).toBeInTheDocument();
    expect(screen.queryByText('Music Result')).not.toBeInTheDocument();
  });

  it("'사용자' 검색 탭은 렌더링하지 않는다", () => {
    render(<MusicPickerSearch query="song" onQueryChange={jest.fn()} onSelect={jest.fn()} />);

    expect(screen.queryByRole('button', { name: '사용자' })).not.toBeInTheDocument();
  });

  it('결과 클릭 시 onSelect에 원본 Music 객체를 변환 없이 그대로 전달한다', () => {
    const onSelect = jest.fn();
    render(<MusicPickerSearch query="song" onQueryChange={jest.fn()} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Music Result'));

    expect(onSelect).toHaveBeenCalledWith(mockTrack);
  });

  it('입력값 변경 시 onQueryChange를 호출한다', () => {
    const onQueryChange = jest.fn();
    render(<MusicPickerSearch query="" onQueryChange={onQueryChange} onSelect={jest.fn()} placeholder="검색해보세요" />);

    fireEvent.change(screen.getByPlaceholderText('검색해보세요'), { target: { value: 'song' } });

    expect(onQueryChange).toHaveBeenCalledWith('song');
  });
});
