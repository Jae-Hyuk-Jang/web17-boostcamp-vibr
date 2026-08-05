'use client';

import type { ReactNode } from 'react';
import type { PlaybackEngine } from '@/types';
import { useItunesHook } from '@/hooks/player/useItunesHook';

type Props = {
  children: (engine: PlaybackEngine) => ReactNode;
};

export default function ItunesEngine({ children }: Props) {
  const { positionMs, durationMs, seekToMs } = useItunesHook();

  return <>{children({ containerRef: null, seekToMs, positionMs, durationMs })}</>;
}
