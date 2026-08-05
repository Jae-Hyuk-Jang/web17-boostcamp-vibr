import { useCallback, useMemo } from 'react';
import { usePlayerStore } from '@/stores';

const findCurrentIndex = (currentMusicId: string | null, queueIds: string[]): number => {
  if (!currentMusicId) return -1;
  return queueIds.indexOf(currentMusicId);
};

/**
 * 현재곡/재생상태/이전·다음 가능 여부/토글·이전·다음 액션을 한데 묶어 제공한다.
 * NowPlaying과 MiniPlayerBar가 각자 직접 호출한다(합성 컴포넌트인 RightPanel을
 * 거치지 않음) — 순수 파생값이라 여러 곳에서 호출해도 안전하다.
 */
export function usePlayerNavigation() {
  const currentMusic = usePlayerStore((s) => s.currentMusic);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const queue = usePlayerStore((s) => s.queue);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const playPrev = usePlayerStore((s) => s.playPrev);
  const playNext = usePlayerStore((s) => s.playNext);

  const queueIds = useMemo(() => queue.map((m) => m.id), [queue]);
  const currentIndex = useMemo(() => findCurrentIndex(currentMusic?.id ?? null, queueIds), [currentMusic?.id, queueIds]);

  const isPrevAvailable = currentIndex > 0;
  const isNextAvailable = currentIndex >= 0 && currentIndex < queue.length - 1;

  const onTogglePlay = useCallback(() => {
    if (!currentMusic) return;
    togglePlay();
  }, [currentMusic, togglePlay]);

  return { currentMusic, isPlaying, isPrevAvailable, isNextAvailable, onTogglePlay, onPrev: playPrev, onNext: playNext };
}
