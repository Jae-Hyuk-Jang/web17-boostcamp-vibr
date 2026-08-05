'use client';

import { useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { usePlayerStore } from '@/stores';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import { getNowPlaylist, updateNowPlaylist } from '@/api/internal/nowPlaylist';
import { nowPlaylistQueryKey } from '@/query-keys';

type Options = { enabled: boolean };

const QUEUE_SYNC_DEBOUNCE_MS = 1500;
const QUEUE_SYNC_RETRY_COUNT = 2;
const QUEUE_SYNC_RETRY_DELAY_MS = 100;

export const useQueueSync = ({ enabled }: Options) => {
  const queue = usePlayerStore((s) => s.queue);
  const initializeQueue = usePlayerStore((s) => s.initializeQueue);

  const hydratedRef = useRef(false);

  const { data: serverQueue, isSuccess: isInitialLoadSuccess } = useQuery({
    queryKey: nowPlaylistQueryKey,
    queryFn: getNowPlaylist,
    enabled,
    // 로그아웃 후 다른 사용자로 재로그인해도 항상 최신 서버 큐를 다시 불러오도록
    // 전역 기본 staleTime(60s)을 쓰지 않고 매번 stale 취급한다.
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: QUEUE_SYNC_RETRY_COUNT,
    retryDelay: QUEUE_SYNC_RETRY_DELAY_MS,
  });

  // enabled가 false면 서버와 완전 분리, 다시 true가 되면 최초 로드부터 다시 수행
  useEffect(() => {
    if (!enabled) {
      hydratedRef.current = false;
      return;
    }
    if (!isInitialLoadSuccess || hydratedRef.current) return;

    hydratedRef.current = true;
    initializeQueue(serverQueue ?? []);
  }, [enabled, isInitialLoadSuccess, serverQueue, initializeQueue]);

  const debouncedQueue = useDebouncedValue(queue, QUEUE_SYNC_DEBOUNCE_MS);

  const updateMutation = useMutation({
    mutationFn: updateNowPlaylist,
    // 백그라운드 큐 동기화 실패는 사용자에게 토스트로 알리지 않는다(기존 동작 유지)
    meta: { silent: true },
    retry: QUEUE_SYNC_RETRY_COUNT,
    retryDelay: QUEUE_SYNC_RETRY_DELAY_MS,
  });

  // 최초 로드가 끝나기 전(hydratedRef 아직 false)에 debouncedQueue 변화로 이 effect가
  // 재실행되지 않도록, mutate 함수 자체는 ref로만 참조해 deps에서 제외한다.
  const updateMutateRef = useRef(updateMutation.mutate);
  updateMutateRef.current = updateMutation.mutate;

  useEffect(() => {
    if (!enabled || !hydratedRef.current) return;
    updateMutateRef.current(debouncedQueue);
  }, [enabled, debouncedQueue]);
};
