import { renderHook, act } from '@testing-library/react';
import type { MusicResponseDto as Music } from '@repo/dto';
import { MusicProvider } from '@repo/dto/values';

import { useYouTubeVisiblePlayback } from './useYouTubeVisiblePlayback';
import { usePlayerStore } from '@/stores/usePlayerStore';

const MOBILE_WIDTH = 375;
const DESKTOP_WIDTH = 1280;

const song = (id: string, provider: Music['provider']): Music => ({
  id,
  trackUri: `uri-${id}`,
  provider,
  albumCoverUrl: 'https://example.com/a.jpg',
  title: `Song ${id}`,
  artistName: 'Artist',
  durationMs: 200000,
});

const youtubeSong = song('yt', MusicProvider.YOUTUBE);
const itunesSong = song('it', MusicProvider.ITUNES);

const setViewportWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width });
};

const renderVisiblePlayback = (isFullPlayerOpen = false) => {
  const isFullPlayerOpenRef = { current: isFullPlayerOpen };
  const openFullPlayer = jest.fn();
  const { result } = renderHook(() => useYouTubeVisiblePlayback({ isFullPlayerOpenRef, openFullPlayer }));

  return { result, openFullPlayer };
};

describe('useYouTubeVisiblePlayback', () => {
  const originalWidth = window.innerWidth;

  beforeEach(() => {
    usePlayerStore.setState({ queue: [], currentMusic: null, isPlaying: false });
  });

  afterEach(() => {
    setViewportWidth(originalWidth);
  });

  describe('재생이 시작되면 풀 플레이어 열기', () => {
    it('모바일에서 YouTube 곡 재생이 시작되면 풀 플레이어를 연다', () => {
      setViewportWidth(MOBILE_WIDTH);
      const { openFullPlayer } = renderVisiblePlayback();

      act(() => {
        usePlayerStore.getState().playMusic(youtubeSong);
      });

      expect(openFullPlayer).toHaveBeenCalledTimes(1);
    });

    it('풀 플레이어가 이미 열려 있으면 다시 열지 않는다', () => {
      setViewportWidth(MOBILE_WIDTH);
      const { openFullPlayer } = renderVisiblePlayback(true);

      act(() => {
        usePlayerStore.getState().playMusic(youtubeSong);
      });

      expect(openFullPlayer).not.toHaveBeenCalled();
    });

    it('iTunes 곡은 모바일에서 재생돼도 풀 플레이어를 열지 않는다', () => {
      setViewportWidth(MOBILE_WIDTH);
      const { openFullPlayer } = renderVisiblePlayback();

      act(() => {
        usePlayerStore.getState().playMusic(itunesSong);
      });

      expect(openFullPlayer).not.toHaveBeenCalled();
    });

    it('데스크톱에서는 YouTube 곡을 재생해도 풀 플레이어를 열지 않는다', () => {
      setViewportWidth(DESKTOP_WIDTH);
      const { openFullPlayer } = renderVisiblePlayback();

      act(() => {
        usePlayerStore.getState().playMusic(youtubeSong);
      });

      expect(openFullPlayer).not.toHaveBeenCalled();
    });

    it('YouTube 곡 재생 중 화면이 모바일 크기로 줄어들면 풀 플레이어를 연다', () => {
      setViewportWidth(DESKTOP_WIDTH);
      usePlayerStore.setState({ currentMusic: youtubeSong, isPlaying: true });
      const { openFullPlayer } = renderVisiblePlayback();
      expect(openFullPlayer).not.toHaveBeenCalled();

      act(() => {
        setViewportWidth(MOBILE_WIDTH);
        window.dispatchEvent(new Event('resize'));
      });

      expect(openFullPlayer).toHaveBeenCalledTimes(1);
    });
  });

  describe('pauseIfHiddenYouTube (사용자가 풀 플레이어를 닫을 때)', () => {
    it('모바일에서 YouTube 곡이 재생 중이면 일시정지한다', () => {
      setViewportWidth(MOBILE_WIDTH);
      usePlayerStore.setState({ currentMusic: youtubeSong, isPlaying: true });
      const { result } = renderVisiblePlayback(true);

      act(() => {
        result.current.pauseIfHiddenYouTube();
      });

      expect(usePlayerStore.getState().isPlaying).toBe(false);
    });

    it('모바일이라도 iTunes 곡은 계속 재생한다', () => {
      setViewportWidth(MOBILE_WIDTH);
      usePlayerStore.setState({ currentMusic: itunesSong, isPlaying: true });
      const { result } = renderVisiblePlayback(true);

      act(() => {
        result.current.pauseIfHiddenYouTube();
      });

      expect(usePlayerStore.getState().isPlaying).toBe(true);
    });

    it('데스크톱에서는 YouTube 곡도 계속 재생한다', () => {
      setViewportWidth(DESKTOP_WIDTH);
      usePlayerStore.setState({ currentMusic: youtubeSong, isPlaying: true });
      const { result } = renderVisiblePlayback(true);

      act(() => {
        result.current.pauseIfHiddenYouTube();
      });

      expect(usePlayerStore.getState().isPlaying).toBe(true);
    });
  });
});
