'use client';

import { YOUTUBE_IFRAME_ID, YOUTUBE_IFRAME_SCRIPT_SRC } from '@/constants';
import { usePlayerStore } from '@/stores';
import { PlayerProgress } from '@/types';
import { useCallback, useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
  }
}

type Props = {
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  setIsTicking: React.Dispatch<React.SetStateAction<boolean>>;
};

export function useYouTubePlayer({ setProgress, setIsTicking }: Props) {
  const queueLength = usePlayerStore((s) => s.queue.length);
  const playNext = usePlayerStore((s) => s.playNext);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const setPlayError = usePlayerStore((s) => s.setPlayError);

  const [isReady, setIsReady] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const queueLengthRef = useRef(queueLength);

  const waitForYTReady = (intervalMs = 50): Promise<void> =>
    new Promise((resolve) => {
      const check = setInterval(() => {
        if (window.YT?.Player) {
          clearInterval(check);
          resolve();
        }
      }, intervalMs);
    });

  const appendYouTubeScript = () =>
    new Promise<void>((resolve) => {
      const tag = document.createElement('script');
      tag.id = YOUTUBE_IFRAME_ID;
      tag.src = YOUTUBE_IFRAME_SCRIPT_SRC;

      // YouTube IFrame API 자체가 요구하는 전역 콜백 계약(정해진 이름의 window
      // 프로퍼티)이라 구조를 바꿔도 피할 수 없는 전역 쓰기 — effect 내부에서만 호출됨
      // eslint-disable-next-line react-compiler/react-compiler
      window.onYouTubeIframeAPIReady = () => resolve();
      document.body.appendChild(tag);
    });

  const loadScript = useCallback(async () => {
    if (window.YT?.Player) return;

    const existing = document.getElementById(YOUTUBE_IFRAME_ID);
    if (existing) {
      await waitForYTReady();
      return;
    }

    await appendYouTubeScript();
  }, []);

  useEffect(() => {
    queueLengthRef.current = queueLength;
  }, [queueLength]);

  useEffect(() => {
    let isMounted = true;

    const waitForContainer = () =>
      new Promise<HTMLDivElement>((resolve) => {
        const tick = () => {
          if (!isMounted) return;
          const el = containerRef.current;
          if (el) return resolve(el);
          requestAnimationFrame(tick);
        };
        tick();
      });

    const init = async () => {
      await loadScript();
      const el = await waitForContainer();
      if (!isMounted || playerRef.current) return;

      playerRef.current = new window.YT.Player(el, {
        playerVars: { autoplay: 0, controls: 1 },
        events: {
          onReady: (e) => {
            playerRef.current = e.target;
            setIsReady(true);
          },
          onError: (e) => {
            setPlayError(`Youtube error: ${e.data}`);
            togglePlay();
          },
          onStateChange: (e) => {
            const player = playerRef.current;
            if (!player) return;

            const syncDuration = () => {
              const d = player.getDuration(); // 현재 위치 (seconds)
              const durationMs = d > 0 ? Math.floor(d * 1000) : 0;
              if (durationMs > 0) {
                setProgress((prev) => ({ ...prev, durationMs: durationMs || prev.durationMs }));
              }
            };

            switch (e.data) {
              case YT.PlayerState.PLAYING:
                syncDuration();
                setIsTicking(true);
                break;

              case YT.PlayerState.PAUSED:
              case YT.PlayerState.BUFFERING:
              case YT.PlayerState.CUED:
                syncDuration();
                setIsTicking(false);
                break;

              case YT.PlayerState.ENDED: {
                setIsTicking(false);

                const qLen = queueLengthRef.current;

                if (qLen <= 1) {
                  player.seekTo(0, true);
                  player.playVideo();
                  return;
                }

                playNext();
                break;
              }

              default: // UNSTARTED 등
                setIsTicking(false);
                break;
            }
          },
        },
      });
    };

    init();

    return () => {
      isMounted = false;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // queueLength 변화는 queueLengthRef로 우회하므로 deps에서 제외.
    // loadScript/playNext/togglePlay/setPlayError/setProgress/setIsTicking은
    // 전부 안정적 참조(useCallback([])/zustand action/useState setter)라
    // 실질적으로 값이 바뀌지 않아 마운트 시 1회만 실행되는 동작은 그대로 유지됨
  }, [loadScript, playNext, togglePlay, setPlayError, setProgress, setIsTicking]);

  return {
    containerRef,
    playerRef,
    ready: isReady,
  };
}
