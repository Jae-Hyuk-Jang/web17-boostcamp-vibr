import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { MusicProvider } from '@repo/dto/values';

import useIsMobile from '@/hooks/useIsMobile';
import { usePlayerStore } from '@/stores';

type Params = {
  /** 풀 플레이어가 열려 있는지. 렌더 시점과 무관하게 최신 값을 읽기 위해 ref로 받는다. */
  isFullPlayerOpenRef: RefObject<boolean>;
  openFullPlayer: () => void;
};

/**
 * 모바일(lg 미만)에서 YouTube 곡이 보이지 않는 플레이어로 재생되지 않게 한다.
 *
 * YouTube 정책은 화면에 보이지 않는 플레이어로 재생하는 것을 금지한다. 모바일에서는 YouTube iframe이 든
 * 패널이 풀 플레이어를 열었을 때만 보이므로 두 가지 규칙을 지킨다.
 * - YouTube 곡 재생이 시작되면 풀 플레이어를 연다(재생 중 곡이 YouTube로 바뀌거나 화면이 모바일 크기로 줄어든 경우 포함).
 * - 사용자가 풀 플레이어를 닫을 때 YouTube 곡이 재생 중이면 일시정지한다(`pauseIfHiddenYouTube`).
 *
 * 데스크톱에서는 패널이 항상 보이므로 아무것도 하지 않는다. iTunes 미리듣기는 대상이 아니다.
 */
export function useYouTubeVisiblePlayback({ isFullPlayerOpenRef, openFullPlayer }: Params) {
  const isMobile = useIsMobile();
  const isMobileRef = useRef(isMobile);
  isMobileRef.current = isMobile;

  const isYouTubePlaying = usePlayerStore((s) => s.isPlaying && s.currentMusic?.provider === MusicProvider.YOUTUBE);

  useEffect(() => {
    if (!isMobile || !isYouTubePlaying || isFullPlayerOpenRef.current) return;
    openFullPlayer();
  }, [isMobile, isYouTubePlaying, isFullPlayerOpenRef, openFullPlayer]);

  // 사용자가 풀 플레이어를 닫는 모든 경로(X, ESC, 뒤로가기, 스와이프)에서 호출한다.
  const pauseIfHiddenYouTube = useCallback(() => {
    if (!isMobileRef.current) return;

    const { isPlaying, currentMusic, pause } = usePlayerStore.getState();
    if (isPlaying && currentMusic?.provider === MusicProvider.YOUTUBE) pause();
  }, []);

  return { pauseIfHiddenYouTube };
}
