'use client';

import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

type Params = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  /**
   * 트리거 요소가 이 비율 이상 보여야 다음 페이지를 부른다(기본 0.8).
   * 가로 스크롤 안처럼 요소가 일부만 보이기 쉬운 곳에서는 0을 넘긴다.
   */
  threshold?: number;
};

const DEFAULT_VISIBLE_RATIO = 0.8;

/**
 * useInfiniteQuery 기반 목록에서 반복되는 스크롤 트리거 배선만 담당하는 경량 훅.
 * 데이터 셰이프·쿼리키에는 관여하지 않는다 — 트리거 요소가 화면에 보이고(threshold 비율 이상, rootMargin 200px)
 * 다음 페이지가 있고 이미 로딩 중이 아닐 때만 fetchNextPage()를 호출한다.
 */
export function useInfiniteScrollTrigger({ hasNextPage, isFetchingNextPage, fetchNextPage, threshold = DEFAULT_VISIBLE_RATIO }: Params) {
  const { ref, inView: isInView } = useInView({ threshold, rootMargin: '200px' });

  useEffect(() => {
    if (isInView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [isInView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return ref;
}
