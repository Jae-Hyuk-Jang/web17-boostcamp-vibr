import type { ComponentType, ReactNode } from 'react';
import { MusicProvider } from '@repo/dto/values';
import type { PlaybackEngine } from '@/types';
import ItunesEngine from './ItunesEngine';
import YouTubeEngine from './YouTubeEngine';

export type EngineComponent = ComponentType<{ children: (engine: PlaybackEngine) => ReactNode }>;

/**
 * provider → 재생 엔진 컴포넌트 매핑.
 * 향후 재생 프로바이더가 추가되면 이 레지스트리에 항목만 추가하면 된다.
 * APPLE은 현재 별도 재생 로직이 없어 ITUNES와 동일한 엔진을 쓴다(기존 usePlayback의
 * "YouTube가 아니면 iTunes" 기본 동작과 동일).
 */
export const ENGINE_REGISTRY: Record<MusicProvider, EngineComponent> = {
  [MusicProvider.APPLE]: ItunesEngine,
  [MusicProvider.ITUNES]: ItunesEngine,
  [MusicProvider.YOUTUBE]: YouTubeEngine,
};

export const DEFAULT_ENGINE_PROVIDER = MusicProvider.ITUNES;
