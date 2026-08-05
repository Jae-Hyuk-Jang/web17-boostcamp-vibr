'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { usePlayerStore } from '@/stores';
import type { PlaybackEngine } from '@/types';
import { ENGINE_REGISTRY, DEFAULT_ENGINE_PROVIDER } from './engineRegistry';

type PlaybackRefsValue = Pick<PlaybackEngine, 'containerRef' | 'seekToMs'>;
type PlaybackProgressValue = Pick<PlaybackEngine, 'positionMs' | 'durationMs'>;

const PlaybackRefsContext = createContext<PlaybackRefsValue | null>(null);
const PlaybackProgressContext = createContext<PlaybackProgressValue | null>(null);

function PlaybackContexts({ engine, children }: { engine: PlaybackEngine; children: React.ReactNode }) {
  // 거의 안 변하는 값들만(cover는 이것만 구독)
  const refsValue = useMemo<PlaybackRefsValue>(
    () => ({ containerRef: engine.containerRef, seekToMs: engine.seekToMs }),
    [engine.containerRef, engine.seekToMs],
  );

  // tick으로 자주 변하는 값들만(progress는 이것만 구독)
  const progressValue = useMemo<PlaybackProgressValue>(
    () => ({ positionMs: engine.positionMs, durationMs: engine.durationMs }),
    [engine.positionMs, engine.durationMs],
  );

  return (
    <PlaybackRefsContext.Provider value={refsValue}>
      <PlaybackProgressContext.Provider value={progressValue}>{children}</PlaybackProgressContext.Provider>
    </PlaybackRefsContext.Provider>
  );
}

export function PlaybackProvider({ children }: { children: React.ReactNode }) {
  const provider = usePlayerStore((s) => s.currentMusic?.provider);
  const Engine = (provider && ENGINE_REGISTRY[provider]) || ENGINE_REGISTRY[DEFAULT_ENGINE_PROVIDER];

  return <Engine>{(engine) => <PlaybackContexts engine={engine}>{children}</PlaybackContexts>}</Engine>;
}

export function usePlaybackRefs() {
  const v = useContext(PlaybackRefsContext);
  if (!v) throw new Error('usePlaybackRefs must be used within PlaybackProvider');
  return v;
}

export function usePlaybackProgress() {
  const v = useContext(PlaybackProgressContext);
  if (!v) throw new Error('usePlaybackProgress must be used within PlaybackProvider');
  return v;
}
