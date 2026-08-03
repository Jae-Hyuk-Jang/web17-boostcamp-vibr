'use client';

import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

type Params = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
};

/**
 * useInfiniteQuery 기반 목록에서 반복되는 스크롤 트리거 배선만 담당하는 경량 훅.
 * 데이터 셰이프·쿼리키에는 관여하지 않는다 — 화면에 보이고(threshold 0.8, rootMargin 200px)
 * 다음 페이지가 있고 이미 로딩 중이 아닐 때만 fetchNextPage()를 호출한다.
 */
export function useInfiniteScrollTrigger({ hasNextPage, isFetchingNextPage, fetchNextPage }: Params) {
  const { ref, inView: isInView } = useInView({ threshold: 0.8, rootMargin: '200px' });

  useEffect(() => {
    if (isInView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [isInView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return ref;
}
