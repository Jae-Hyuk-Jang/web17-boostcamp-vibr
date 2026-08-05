import type { MusicResponseDto as Music } from '@repo/dto';
import type { RefObject } from 'react';

export interface NowPlayingState {
  currentMusic: Music | null;
  isPlaying: boolean;
}

export interface QueueItem {
  music: Music;
  orderIndex: number;
}

export type PlayerProgress = {
  positionMs: number;
  durationMs: number;
};

export type Playback = PlayerProgress & {
  seekToMs: (ms: number) => void;
};

/**
 * 재생 엔진(iTunes/YouTube 등) 공통 인터페이스.
 * ENGINE_REGISTRY의 각 Engine 컴포넌트가 이 형태로 결과를 넘긴다.
 */
export interface PlaybackEngine {
  containerRef: RefObject<HTMLDivElement | null> | null;
  seekToMs: (ms: number) => void;
  positionMs: number;
  durationMs: number;
}
