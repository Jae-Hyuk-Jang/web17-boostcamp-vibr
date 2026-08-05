import { render, act } from '@testing-library/react';
import type { MusicResponseDto as Music } from '@repo/dto';
import { MusicProvider } from '@repo/dto/values';

import { PlaybackProvider } from './PlaybackProvider';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { YOUTUBE_IFRAME_ID } from '@/constants';

/**
 * player-subscription-boundary CP3(#264) — 재생 엔진 조건부 마운트 회귀 테스트.
 * CP1(옛 usePlayback.characterization.test.ts)에서는 "provider와 무관하게 두 엔진이
 * 항상 마운트된다"는 버그를 특성화했다. CP3에서 PlaybackProvider가 ENGINE_REGISTRY 기반
 * JSX 조건부 마운트로 바뀌면서 usePlayback.ts 자체가 제거됐으므로, 테스트 대상을
 * PlaybackProvider로 옮기고 기대값을 "비활성 엔진은 마운트되지 않는다"로 뒤집는다
 * (의도적인 특성화 테스트 갱신).
 */

const itunesMusic: Music = {
  id: 'm-itunes',
  trackUri: 'https://example.com/preview.m4a',
  provider: MusicProvider.ITUNES,
  albumCoverUrl: 'https://example.com/a.jpg',
  title: 'Itunes Song',
  artistName: 'Itunes Artist',
  durationMs: 200000,
};

const youtubeMusic: Music = {
  id: 'm-youtube',
  trackUri: 'yt-video-id',
  provider: MusicProvider.YOUTUBE,
  albumCoverUrl: 'https://example.com/b.jpg',
  title: 'Youtube Song',
  artistName: 'Youtube Artist',
  durationMs: 240000,
};

describe('PlaybackProvider — 재생 엔진 조건부 마운트 (player-subscription-boundary CP3)', () => {
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

  it('YouTube 트랙 재생 중에는 iTunes용 Audio 엘리먼트가 생성되지 않는다', () => {
    const audioCtor = jest.fn(function AudioMock(this: HTMLAudioElement) {
      return { play: jest.fn(), pause: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn() };
    });
    window.Audio = audioCtor as unknown as typeof window.Audio;

    usePlayerStore.setState({ currentMusic: youtubeMusic, isPlaying: false });

    render(
      <PlaybackProvider>
        <div />
      </PlaybackProvider>,
    );

    expect(audioCtor).not.toHaveBeenCalled();
  });

  it('iTunes 트랙 재생 중에는 YouTube IFrame API 스크립트가 로드되지 않는다', () => {
    usePlayerStore.setState({ currentMusic: itunesMusic, isPlaying: false });

    render(
      <PlaybackProvider>
        <div />
      </PlaybackProvider>,
    );

    expect(document.getElementById(YOUTUBE_IFRAME_ID)).toBeNull();
  });

  it('재생 중인 곡이 없을 때는 기본 엔진(iTunes)만 마운트되고 YouTube 스크립트는 로드되지 않는다', () => {
    const audioCtor = jest.fn(function AudioMock(this: HTMLAudioElement) {
      return { play: jest.fn(), pause: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn() };
    });
    window.Audio = audioCtor as unknown as typeof window.Audio;

    render(
      <PlaybackProvider>
        <div />
      </PlaybackProvider>,
    );

    expect(audioCtor).toHaveBeenCalled();
    expect(document.getElementById(YOUTUBE_IFRAME_ID)).toBeNull();
  });

  it('provider가 iTunes↔YouTube로 전환되면 이전 엔진은 언마운트되고 새 엔진만 마운트된다', () => {
    const audioCtor = jest.fn(function AudioMock(this: HTMLAudioElement) {
      return { play: jest.fn(), pause: jest.fn(), load: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn() };
    });
    window.Audio = audioCtor as unknown as typeof window.Audio;

    usePlayerStore.setState({ currentMusic: itunesMusic, isPlaying: false });

    const { rerender } = render(
      <PlaybackProvider>
        <div />
      </PlaybackProvider>,
    );

    expect(audioCtor).toHaveBeenCalledTimes(1);
    expect(document.getElementById(YOUTUBE_IFRAME_ID)).toBeNull();

    act(() => {
      usePlayerStore.setState({ currentMusic: youtubeMusic });
    });
    rerender(
      <PlaybackProvider>
        <div />
      </PlaybackProvider>,
    );

    expect(document.getElementById(YOUTUBE_IFRAME_ID)).not.toBeNull();
  });
});
