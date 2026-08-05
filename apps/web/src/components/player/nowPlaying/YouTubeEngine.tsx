'use client';

import type { ReactNode } from 'react';
import type { PlaybackEngine } from '@/types';
import { useYouTubeHook } from '@/hooks/player/useYouTubeHook';

type Props = {
  children: (engine: PlaybackEngine) => ReactNode;
};

export default function YouTubeEngine({ children }: Props) {
  const { containerRef, positionMs, durationMs, seekToMs } = useYouTubeHook();

  return <>{children({ containerRef, seekToMs, positionMs, durationMs })}</>;
}
