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

// PostMedia는 착수 전(#277) 전용 테스트가 0개였다 — 이 파일은 구독 전환(#278) 전
// 현재 prop 기반 구현의 동작을 고정하는 characterization test다(feed-search-domain ADR).
describe.each<{ variant: 'card' | 'modal' }>([{ variant: 'card' }, { variant: 'modal' }])(
  'PostMedia — 재생 상태/컨트롤 특성화 (variant=$variant, feed-search-domain #277)',
  ({ variant }) => {
    beforeEach(() => {
      usePlayerStore.setState({ currentMusic: null, isPlaying: false });
    });

    it('커버 페이지에서 전체재생 버튼을 누르면 onPlayAll이 호출된다', () => {
      const onPlayAll = jest.fn();
      render(
        <PostMedia post={mockPost()} variant={variant} currentMusicId={null} isPlayingGlobal={false} onPlay={jest.fn()} onPlayAll={onPlayAll} />,
      );

      fireEvent.click(screen.getByTitle('전체 재생'));

      expect(onPlayAll).toHaveBeenCalledTimes(1);
    });

    it('트랙 페이지에서 재생 버튼을 누르면 onPlay가 활성 트랙과 함께 호출된다', () => {
      const music = mockMusic();
      const onPlay = jest.fn();
      render(
        <PostMedia
          post={mockPost({ musics: [music] })}
          variant={variant}
          currentMusicId={null}
          isPlayingGlobal={false}
          onPlay={onPlay}
          onPlayAll={jest.fn()}
        />,
      );

      // 커버(0) -> 첫 트랙(1)으로 이동
      fireEvent.click(screen.getByTitle('다음'));
      fireEvent.click(screen.getByTitle('재생'));

      expect(onPlay).toHaveBeenCalledWith(music);
    });

    it('활성 트랙이 전역 재생 중이면 일시정지 버튼으로 표시된다', () => {
      const music = mockMusic();
      render(
        <PostMedia
          post={mockPost({ musics: [music] })}
          variant={variant}
          currentMusicId={music.id}
          isPlayingGlobal={true}
          onPlay={jest.fn()}
          onPlayAll={jest.fn()}
        />,
      );

      fireEvent.click(screen.getByTitle('다음'));

      expect(screen.getByTitle('일시정지')).toBeInTheDocument();
    });

    it('currentMusicId가 활성 트랙과 다르면 전역 재생 중이어도 재생 버튼으로 표시된다', () => {
      const music = mockMusic();
      render(
        <PostMedia
          post={mockPost({ musics: [music] })}
          variant={variant}
          currentMusicId="other-music-id"
          isPlayingGlobal={true}
          onPlay={jest.fn()}
          onPlayAll={jest.fn()}
        />,
      );

      fireEvent.click(screen.getByTitle('다음'));

      expect(screen.getByTitle('재생')).toBeInTheDocument();
    });

    it('isPlayingGlobal이 false면 currentMusicId가 일치해도 재생 버튼으로 표시된다', () => {
      const music = mockMusic();
      render(
        <PostMedia
          post={mockPost({ musics: [music] })}
          variant={variant}
          currentMusicId={music.id}
          isPlayingGlobal={false}
          onPlay={jest.fn()}
          onPlayAll={jest.fn()}
        />,
      );

      fireEvent.click(screen.getByTitle('다음'));

      expect(screen.getByTitle('재생')).toBeInTheDocument();
    });
  },
);
