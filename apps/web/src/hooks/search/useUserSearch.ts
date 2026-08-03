'use client';

import { useCallback, useMemo } from 'react';

import { useInfiniteScroll, useDebouncedValue } from '@/hooks';
import { ITUNES_SEARCH } from '@/constants';
import { searchUsers } from '@/api';
import { SearchStatus } from '@/types';
import type { SearchUsersResDto } from '@repo/dto';

type SearchUser = SearchUsersResDto['users'][number];

type Options = {
  query: string;
  enabled?: boolean;
  debounceMs?: number;
  minQueryLength?: number;
  limit?: number;
};

type Result = {
  status: SearchStatus;
  results: SearchUser[];
  errorMessage: string | null;
  trimmedQuery: string;

  hasNext: boolean;
  isLoadingMore: boolean;
  ref: (node?: Element | null) => void;
};

const DEFAULT_LIMIT = 10;

const shouldFetch = (enabled: boolean, q: string, minLen: number) => enabled && q.length >= minLen;

export default function useUserSearch({
  query,
  enabled = true,
  debounceMs = ITUNES_SEARCH.DEBOUNCE_MS,
  minQueryLength = ITUNES_SEARCH.MIN_QUERY_LENGTH,
  limit = DEFAULT_LIMIT,
}: Options): Result {
  const debounced = useDebouncedValue(query, debounceMs);
  const trimmedQuery = useMemo(() => debounced.trim(), [debounced]);

  const isFetchable = useMemo(() => shouldFetch(enabled, trimmedQuery, minQueryLength), [enabled, trimmedQuery, minQueryLength]);

  const fetchFn = useCallback(
    async (cursor?: string) => {
      if (!isFetchable) return { items: [], hasNext: false, nextCursor: undefined };

      const data = await searchUsers(trimmedQuery, cursor, limit);
      const users = Array.isArray(data.users) ? data.users : [];

      return {
        items: users,
        hasNext: Boolean(data.hasNext),
        nextCursor: data.nextCursor,
      };
    },
    [isFetchable, trimmedQuery, limit],
  );

  const { items, hasNext, isLoading, isInitialLoading, errorMsg, ref } = useInfiniteScroll<SearchUser>({
    fetchFn,
    resetKey: isFetchable ? trimmedQuery : '',
  });

  const status: SearchStatus = useMemo(() => {
    if (!enabled) return 'idle';
    if (trimmedQuery.length === 0) return 'idle';
    if (trimmedQuery.length < minQueryLength) return 'idle';

    if (isInitialLoading) return 'loading';
    // 초기 로드가 실패해 보여줄 결과가 하나도 없는 경우에만 에러로 취급한다.
    // 이미 로드된 결과가 있는 상태에서 추가 로드(loadMore)만 실패한 경우는 기존 결과를 유지한다.
    if (errorMsg && items.length === 0) return 'error';
    if (items.length === 0) return 'empty';
    return 'success';
  }, [enabled, trimmedQuery, minQueryLength, isInitialLoading, errorMsg, items.length]);

  const errorMessage = useMemo(() => {
    if (status !== 'error') return null;
    return errorMsg ?? '검색 중 오류가 발생했습니다.';
  }, [status, errorMsg]);

  return {
    status,
    results: items,
    errorMessage,
    trimmedQuery,
    hasNext,
    isLoadingMore: isLoading,
    ref,
  };
}
