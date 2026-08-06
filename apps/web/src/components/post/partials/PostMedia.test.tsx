import { render, screen, fireEvent } from '@testing-library/react';
import type { MusicResponseDto as Music, PostResponseDto as Post } from '@repo/dto';

import PostMedia from './PostMedia';
import { usePlayerStore } from '@/stores/usePlayerStore';

const mockMusic = (overrides: Partial<Music> = {}): Music => ({
  id: 'music-1',
  trackUri: 'track-uri-1',
  provider: 'itunes' as Music['provider'],
  albumCoverUrl: 'https://example.com/cover.jpg',
  title: 'Song Title',
  artistName: 'Artist',
  durationMs: 200000,
  ...overrides,
});

const mockPost = (overrides: Partial<Post> = {}): Post => ({
  id: 'post-1',
  author: { id: 'author-1', nickname: 'author', profileImgUrl: null },
  coverImgUrl: 'https://example.com/post-cover.jpg',
  musics: [mockMusic()],
  content: 'content',
  likeCount: 0,
  commentCount: 0,
  createdAt: new Date().toISOString(),
  isEdited: false,
  isLiked: false,
  ...overrides,
});

// #277에서 prop 기반으로 고정한 특성화 테스트를, #278의 usePlayerStore 직접구독 전환에 맞춰
// "prop 대신 store를 직접 세팅해도 동일한 결과가 나온다"는 contract 테스트로 갱신했다
// (feed-search-domain ADR — CP2 요구사항).
describe.each<{ variant: 'card' | 'modal' }>([{ variant: 'card' }, { variant: 'modal' }])(
  'PostMedia — 재생 상태/컨트롤 (variant=$variant, feed-search-domain #278)',
  ({ variant }) => {
    beforeEach(() => {
      usePlayerStore.setState({ currentMusic: null, isPlaying: false });
    });

    it('커버 페이지에서 전체재생 버튼을 누르면 onPlayAll이 호출된다', () => {
      const onPlayAll = jest.fn();
      render(<PostMedia post={mockPost()} variant={variant} onPlay={jest.fn()} onPlayAll={onPlayAll} />);

      fireEvent.click(screen.getByTitle('전체 재생'));

      expect(onPlayAll).toHaveBeenCalledTimes(1);
    });

    it('트랙 페이지에서 재생 버튼을 누르면 onPlay가 활성 트랙과 함께 호출된다', () => {
      const music = mockMusic();
      const onPlay = jest.fn();
      render(<PostMedia post={mockPost({ musics: [music] })} variant={variant} onPlay={onPlay} onPlayAll={jest.fn()} />);

      // 커버(0) -> 첫 트랙(1)으로 이동
      fireEvent.click(screen.getByTitle('다음'));
      fireEvent.click(screen.getByTitle('재생'));

      expect(onPlay).toHaveBeenCalledWith(music);
    });

    it('스토어의 현재 트랙이 활성 트랙과 같고 재생 중이면 일시정지 버튼으로 표시된다', () => {
      const music = mockMusic();
      usePlayerStore.setState({ currentMusic: music, isPlaying: true });

      render(<PostMedia post={mockPost({ musics: [music] })} variant={variant} onPlay={jest.fn()} onPlayAll={jest.fn()} />);

      fireEvent.click(screen.getByTitle('다음'));

      expect(screen.getByTitle('일시정지')).toBeInTheDocument();
    });

    it('스토어의 현재 트랙이 활성 트랙과 다르면 재생 중이어도 재생 버튼으로 표시된다', () => {
      const music = mockMusic();
      usePlayerStore.setState({ currentMusic: mockMusic({ id: 'other-music-id' }), isPlaying: true });

      render(<PostMedia post={mockPost({ musics: [music] })} variant={variant} onPlay={jest.fn()} onPlayAll={jest.fn()} />);

      fireEvent.click(screen.getByTitle('다음'));

      expect(screen.getByTitle('재생')).toBeInTheDocument();
    });

    it('스토어의 isPlaying이 false면 현재 트랙이 일치해도 재생 버튼으로 표시된다', () => {
      const music = mockMusic();
      usePlayerStore.setState({ currentMusic: music, isPlaying: false });

      render(<PostMedia post={mockPost({ musics: [music] })} variant={variant} onPlay={jest.fn()} onPlayAll={jest.fn()} />);

      fireEvent.click(screen.getByTitle('다음'));

      expect(screen.getByTitle('재생')).toBeInTheDocument();
    });
  },
);
