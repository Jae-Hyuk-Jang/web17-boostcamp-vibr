import { renderHook, act } from '@testing-library/react';
import type { MusicResponseDto as Music } from '@repo/dto';

import { usePlayback } from './usePlayback';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { YOUTUBE_IFRAME_ID } from '@/constants';

/**
 * player-subscription-boundary CP1 — 리팩터링(CP3) 착수 전 현재 동작을 고정한다.
 * 아래 두 테스트는 usePlayback이 provider와 무관하게 두 재생 엔진의 마운트 부수효과를
 * 전부 실행한다는 "버그"를 특성화한다 — CP3에서 조건부 마운트로 바뀌면 이 테스트들은
 * 새 기대값(비활성 엔진은 실행되지 않음)으로 의도적으로 갱신된다.
 */

const itunesMusic: Music = {
  id: 'm-itunes',
  trackUri: 'https://example.com/preview.m4a',
  provider: 'ITUNES' as Music['provider'],
  albumCoverUrl: 'https://example.com/a.jpg',
  title: 'Itunes Song',
  artistName: 'Itunes Artist',
  durationMs: 200000,
};

const youtubeMusic: Music = {
  id: 'm-youtube',
  trackUri: 'yt-video-id',
  provider: 'YOUTUBE' as Music['provider'],
  albumCoverUrl: 'https://example.com/b.jpg',
  title: 'Youtube Song',
  artistName: 'Youtube Artist',
  durationMs: 240000,
};

describe('usePlayback — 재생 엔진 동시 마운트 특성화 테스트 (player-subscription-boundary CP1)', () => {
  const originalAudio = window.Audio;

  beforeAll(() => {
    // jsdom이 HTMLMediaElement.play/pause/load를 구현하지 않아 나는 콘솔 노이즈 제거
    HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined);
    HTMLMediaElement.prototype.pause = jest.fn();
    HTMLMediaElement.prototype.load = jest.fn();
  });

  beforeEach(() => {
    usePlayerStore.setState({ queue: [], currentMusic: null, isPlaying: false, playError: null });
    document.getElementById(YOUTUBE_IFRAME_ID)?.remove();
    delete (window as unknown as { YT?: unknown }).YT;
  });

  afterEach(() => {
    window.Audio = originalAudio;
    document.getElementById(YOUTUBE_IFRAME_ID)?.remove();
  });

  it('[현재 버그] YouTube 트랙 재생 중에도 iTunes용 Audio 엘리먼트가 생성된다', () => {
    const audioCtor = jest.fn(function AudioMock(this: HTMLAudioElement) {
      return { play: jest.fn(), pause: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn() };
    });
    window.Audio = audioCtor as unknown as typeof window.Audio;

    usePlayerStore.setState({ currentMusic: youtubeMusic, isPlaying: false });

    act(() => {
      renderHook(() => usePlayback());
    });

    expect(audioCtor).toHaveBeenCalled();
  });

  it('[현재 버그] iTunes 트랙 재생 중에도 YouTube IFrame API 스크립트가 항상 로드된다', () => {
    usePlayerStore.setState({ currentMusic: itunesMusic, isPlaying: false });

    act(() => {
      renderHook(() => usePlayback());
    });

    expect(document.getElementById(YOUTUBE_IFRAME_ID)).not.toBeNull();
  });

  it('재생 중인 곡이 없을 때도 두 엔진의 마운트 부수효과가 모두 실행된다', () => {
    const audioCtor = jest.fn(function AudioMock(this: HTMLAudioElement) {
      return { play: jest.fn(), pause: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn() };
    });
    window.Audio = audioCtor as unknown as typeof window.Audio;

    act(() => {
      renderHook(() => usePlayback());
    });

    expect(audioCtor).toHaveBeenCalled();
    expect(document.getElementById(YOUTUBE_IFRAME_ID)).not.toBeNull();
  });
});
