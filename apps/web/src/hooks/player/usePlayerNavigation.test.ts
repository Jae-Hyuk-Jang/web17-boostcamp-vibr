import { renderHook, act } from '@testing-library/react';
import type { MusicResponseDto as Music } from '@repo/dto';

import { usePlayerNavigation } from './usePlayerNavigation';
import { usePlayerStore } from '@/stores/usePlayerStore';

const song = (id: string): Music => ({
  id,
  trackUri: `uri-${id}`,
  provider: 'ITUNES' as Music['provider'],
  albumCoverUrl: 'https://example.com/a.jpg',
  title: `Song ${id}`,
  artistName: 'Artist',
  durationMs: 200000,
});

describe('usePlayerNavigation — player-subscription-boundary CP2', () => {
  beforeEach(() => {
    usePlayerStore.setState({ queue: [], currentMusic: null, isPlaying: false });
  });

  it('큐가 비어있으면 canPrev/canNext 모두 false다', () => {
    const { result } = renderHook(() => usePlayerNavigation());
    expect(result.current.isPrevAvailable).toBe(false);
    expect(result.current.isNextAvailable).toBe(false);
  });

  it('현재곡이 큐의 첫 곡이면 canPrev는 false, canNext는 true다', () => {
    usePlayerStore.setState({ queue: [song('a'), song('b')], currentMusic: song('a') });
    const { result } = renderHook(() => usePlayerNavigation());
    expect(result.current.isPrevAvailable).toBe(false);
    expect(result.current.isNextAvailable).toBe(true);
  });

  it('현재곡이 큐의 마지막 곡이면 canPrev는 true, canNext는 false다', () => {
    usePlayerStore.setState({ queue: [song('a'), song('b')], currentMusic: song('b') });
    const { result } = renderHook(() => usePlayerNavigation());
    expect(result.current.isPrevAvailable).toBe(true);
    expect(result.current.isNextAvailable).toBe(false);
  });

  it('현재곡이 큐에 없으면(currentIndex -1) canPrev/canNext 모두 false다', () => {
    usePlayerStore.setState({ queue: [song('a')], currentMusic: song('z') });
    const { result } = renderHook(() => usePlayerNavigation());
    expect(result.current.isPrevAvailable).toBe(false);
    expect(result.current.isNextAvailable).toBe(false);
  });

  it('onTogglePlay는 currentMusic이 없으면 togglePlay를 호출하지 않는다', () => {
    const { result } = renderHook(() => usePlayerNavigation());

    act(() => {
      result.current.onTogglePlay();
    });

    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });

  it('onTogglePlay는 currentMusic이 있으면 togglePlay를 호출한다', () => {
    usePlayerStore.setState({ queue: [song('a')], currentMusic: song('a'), isPlaying: false });
    const { result } = renderHook(() => usePlayerNavigation());

    act(() => {
      result.current.onTogglePlay();
    });

    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });
});
