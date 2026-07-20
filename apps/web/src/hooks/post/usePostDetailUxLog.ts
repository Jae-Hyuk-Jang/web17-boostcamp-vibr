'use client';

import { useCallback, useEffect, useRef } from 'react';

import { enqueueLog } from '@/utils/logQueue';
import { makePostDetailLog } from '@/api/internal/logging';

type Options = {
  enabled: boolean;
  postId: string | undefined;
  userId: string | null | undefined;
  isPlaying: boolean;
  currentMusicId: string | null | undefined;
  postMusicIds: string[];
};

type Result = {
  recordPlayedMusic: (musicId: string) => void;
  emit: () => void;
};

export default function usePostDetailUxLog({ enabled, postId, userId, isPlaying, currentMusicId, postMusicIds }: Options): Result {
  const openedAtRef = useRef<number>(0);
  const playedMusicIdsRef = useRef<Set<string>>(new Set());
  const listenMsByMusicRef = useRef<Record<string, number>>({});
  const lastTickRef = useRef<number>(0);
  const emittedRef = useRef<boolean>(false); // 중복 방지

  // 모달 열릴 때(또는 게시글 전환 시) 초기화
  useEffect(() => {
    if (!enabled || !postId) return;

    openedAtRef.current = Date.now();
    playedMusicIdsRef.current = new Set();
    listenMsByMusicRef.current = {};
    lastTickRef.current = Date.now();
    emittedRef.current = false; // open 시 reset
  }, [enabled, postId]);

  const recordPlayedMusic = useCallback((musicId: string) => {
    if (musicId) playedMusicIdsRef.current.add(musicId);
  }, []);

  // listen time 누적(1초 tick)
  useEffect(() => {
    if (!enabled || !postId) return;

    const postMusicIdSet = new Set(postMusicIds);

    const tick = () => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      // 로그인 사용자만 수집(서버 /api/logs AuthGuard)
      if (!userId) return;

      if (!isPlaying) return;
      if (!currentMusicId) return;

      // 상세 모달 "컨텐츠의 음악"을 재생 중인 경우만 누적
      if (!postMusicIdSet.has(currentMusicId)) return;

      const prev = listenMsByMusicRef.current[currentMusicId] ?? 0;
      listenMsByMusicRef.current[currentMusicId] = prev + Math.max(0, delta);
    };

    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [enabled, postId, postMusicIds, userId, isPlaying, currentMusicId]);

  const emitPostDetailSummary = useCallback(() => {
    if (!userId) return; // 로그인 사용자만
    if (!postId) return;

    const dwellMs = openedAtRef.current ? Date.now() - openedAtRef.current : 0;
    const playedMusicCount = playedMusicIdsRef.current.size;
    const listenMsByMusic = listenMsByMusicRef.current;

    enqueueLog(
      makePostDetailLog({
        postId,
        dwellMs,
        playedMusicCount,
        listenMsByMusic,
      }),
    );
  }, [userId, postId]);

  // 중복 2회 기록 방지
  const emit = useCallback(() => {
    if (emittedRef.current) return;
    emittedRef.current = true;
    emitPostDetailSummary();
  }, [emitPostDetailSummary]);

  return { recordPlayedMusic, emit };
}
