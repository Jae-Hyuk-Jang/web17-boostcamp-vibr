'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';

interface InfiniteResponse<T, TCursor> {
  items: T[];
  hasNext: boolean;
  nextCursor?: TCursor;
}

interface UseInfiniteScrollParams<T, TCursor> {
  fetchFn: (cursor?: TCursor, limit?: number) => Promise<InfiniteResponse<T, TCursor>>;
  /** query 변경 등으로 목록을 초기화해야 할 때 사용 */
  resetKey?: string;
  /** 최초 fetch 완료 전에 미리 보여줄 아이템(예: 공유 라우트에서 특정 글을 목록 맨 앞에 시딩) */
  initialItems?: T[];
  /** 페이지 병합 전략. 기본값은 단순 concat이며, dedupe 등이 필요하면 주입한다 */
  mergeItems?: (prev: T[], next: T[]) => T[];
}

export default function useInfiniteScroll<T, TCursor = string | undefined>({
  fetchFn,
  resetKey,
  initialItems = [],
  mergeItems,
}: UseInfiniteScrollParams<T, TCursor>) {
  const { ref, inView: isInView } = useInView({ threshold: 0.8, rootMargin: '200px' });

  const [items, setItems] = useState<T[]>(initialItems);
  const [hasNext, setHasNext] = useState(false);
  const [nextCursor, setNextCursor] = useState<TCursor | undefined>(undefined);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null); // 추가 데이터 fetch 오류
  // 초기 데이터 로드 관련 state
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const prevResetKeyRef = useRef<string | undefined>(undefined);
  const initialLoadedRef = useRef(false); // 초기 데이터 fetch 재호출 방지 가드

  const combineItems = useCallback((prev: T[], next: T[]) => (mergeItems ? mergeItems(prev, next) : [...prev, ...next]), [mergeItems]);

  /** 무한 스크롤 관련 상태 업데이트 함수 */
  const updateScrollStates = useCallback(
    (data: InfiniteResponse<T, TCursor>) => {
      setItems((prev) => combineItems(prev, data.items));
      setHasNext(data.hasNext);
      setNextCursor(data.nextCursor);
      setErrorMsg(null);
    },
    [combineItems],
  );

  const reset = useCallback(() => {
    setItems([]);
    setHasNext(false);
    setNextCursor(undefined);

    setIsLoading(false);
    setErrorMsg(null);

    setIsInitialLoading(true);
  }, []);

  /** 초기 데이터 fetch 함수 */
  const loadInitialData = useCallback(async () => {
    setIsInitialLoading(true);
    try {
      const data = await fetchFn();
      updateScrollStates(data);
    } catch {
      setErrorMsg('오류가 발생했습니다.');
    } finally {
      setIsInitialLoading(false); // 초기 데이터 fetching 로딩 상태는 따로 관리 (스켈레톤 UI 렌더링 목적)
    }
  }, [fetchFn, updateScrollStates]);

  /** 추가 데이터 fetch 함수 */
  const loadMore = useCallback(async () => {
    if (!hasNext || isLoading) return;

    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 300)); // 로딩 스피너 짧게 노출

    try {
      const data = await fetchFn(nextCursor);
      updateScrollStates(data);
    } catch {
      setErrorMsg('오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, hasNext, isLoading, nextCursor, updateScrollStates]);

  // 최초 1회 로드
  useEffect(() => {
    if (initialLoadedRef.current) return;
    initialLoadedRef.current = true;
    loadInitialData();
  }, [loadInitialData]);

  // resetKey 변경 시: reset + 초기 로드 재실행
  useEffect(() => {
    if (resetKey === undefined) return;

    const prev = prevResetKeyRef.current;
    prevResetKeyRef.current = resetKey;

    // 첫 마운트에서는 중복 호출 방지
    if (prev === undefined) return;
    if (prev === resetKey) return;

    reset();
    void loadInitialData();
  }, [resetKey, reset, loadInitialData]);

  useEffect(() => {
    if (isInView) void loadMore();
  }, [isInView, loadMore]);

  return {
    items,
    setItems,
    hasNext,
    nextCursor,
    isLoading,
    isInitialLoading,
    errorMsg,
    ref,
    reset,
  };
}
