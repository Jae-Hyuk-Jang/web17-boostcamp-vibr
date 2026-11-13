'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { X } from 'lucide-react';

import { QueueList, MiniPlayerBar, NowPlaying } from './index';
import { useQueueSync, useGuestQueueSession, useYouTubeVisiblePlayback } from '@/hooks';
import { useAuthMe } from '@/hooks/auth/client';

export default function RightPanel() {
  const { isAuthenticated, isLoading } = useAuthMe();
  const isServerSyncEnabled = isAuthenticated && !isLoading;
  const isGuestSessionEnabled = !isAuthenticated && !isLoading;

  useQueueSync({ enabled: isServerSyncEnabled });
  useGuestQueueSession(isGuestSessionEnabled);

  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const isFullPlayerOpenRef = useRef(isFullPlayerOpen);
  isFullPlayerOpenRef.current = isFullPlayerOpen;

  const queueSectionRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToQueue, setShouldScrollToQueue] = useState(false);

  // ListPlus 버튼으로 열렸을 때만 QueueList 위치로 스크롤한다
  useEffect(() => {
    if (!isFullPlayerOpen || !shouldScrollToQueue) return;
    queueSectionRef.current?.scrollIntoView({ block: 'start' });
    setShouldScrollToQueue(false);
  }, [isFullPlayerOpen, shouldScrollToQueue]);

  const handleOpenFullPlayer = useCallback(() => {
    setIsFullPlayerOpen(true);
  }, []);

  const handleOpenQueue = useCallback(() => {
    setShouldScrollToQueue(true);
    setIsFullPlayerOpen(true);
  }, []);

  // 모바일에서 YouTube 곡은 풀 플레이어가 열려 있을 때만 재생한다 (YouTube 정책: 보이지 않는 플레이어로 재생 금지)
  const { pauseIfHiddenYouTube } = useYouTubeVisiblePlayback({
    isFullPlayerOpenRef,
    openFullPlayer: handleOpenFullPlayer,
  });

  // 사용자가 직접 닫는 경로(X, ESC, 뒤로가기, 스와이프). 데스크탑 크기로 커져서 닫힐 때는 패널이 보이므로 거치지 않는다.
  const handleCloseFullPlayer = useCallback(() => {
    setIsFullPlayerOpen(false);
    pauseIfHiddenYouTube();
  }, [pauseIfHiddenYouTube]);

  // 데스크탑 크기로 커지면 풀 플레이어 닫기
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024 && isFullPlayerOpenRef.current) setIsFullPlayerOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // 뒤로가기 / ESC 로 닫기
  useEffect(() => {
    if (isFullPlayerOpen) history.pushState({ vibrFullPlayer: true }, '');
  }, [isFullPlayerOpen]);

  useEffect(() => {
    const onPopState = () => {
      if (isFullPlayerOpenRef.current) handleCloseFullPlayer();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [handleCloseFullPlayer]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullPlayerOpenRef.current) handleCloseFullPlayer();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleCloseFullPlayer]);

  // 스와이프 다운으로 닫기
  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0]?.clientY ?? 0;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if ((e.touches[0]?.clientY ?? 0) - touchStartY.current > 80) {
      handleCloseFullPlayer();
    }
  };

  const section = (
    <section
      className={
        isFullPlayerOpen
          ? 'lg:hidden flex flex-col bg-white fixed inset-0 z-[10001] animate-slide-up'
          : 'hidden lg:flex flex-col h-full w-full bg-white'
      }
      onTouchStart={isFullPlayerOpen ? handleTouchStart : undefined}
      onTouchMove={isFullPlayerOpen ? handleTouchMove : undefined}
    >
      {isFullPlayerOpen && (
        <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
          <div className="flex-1" />
          <div className="w-10 h-1 rounded-full bg-gray-3" />
          <div className="flex-1 flex justify-end">
            <button
              type="button"
              onClick={handleCloseFullPlayer}
              className="p-2 rounded-full hover:bg-gray-4 text-primary transition-colors"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0">
        <NowPlaying />

        <div ref={queueSectionRef}>
          <QueueList />
        </div>
      </div>
    </section>
  );

  return (
    <>
      <MiniPlayerBar onOpenQueue={handleOpenQueue} onOpenFullPlayer={handleOpenFullPlayer} />

      {section}
    </>
  );
}
