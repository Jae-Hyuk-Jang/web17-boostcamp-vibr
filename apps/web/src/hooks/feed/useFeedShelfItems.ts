'use client';

import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { FeedShelfDto, FeedShelfItemDto } from '@repo/dto';
import { getFeedShelfPage } from '@/api';
import { feedShelfMoreQueryKey } from '@/query-keys';

const dedupeByReactionId = (items: FeedShelfItemDto[]) => Array.from(new Map(items.map((item) => [item.reactionId, item])).values());

/**
 * 선반 카드 목록. 첫 페이지는 선반 목록 응답을 그대로 쓰고,
 * 끝까지 넘겼을 때만 그 다음 페이지부터 이어 불러온다(같은 카드를 두 캐시에 두지 않는다).
 */
export const useFeedShelfItems = (shelf: FeedShelfDto) => {
  // 첫 페이지 다음을 가리키는 커서. 없으면 첫 페이지가 전부다
  const firstPageNextCursor = shelf.nextCursor;
  const hasPagesAfterFirst = firstPageNextCursor !== undefined;

  // 어느 첫 페이지의 다음을 요청했는지 커서로 기억한다. 선반 목록이 새로 고쳐져 첫 페이지가 바뀌면 다시 요청해야 한다
  const [requestedAfterCursor, setRequestedAfterCursor] = useState<string>();
  const isLoadMoreRequested = hasPagesAfterFirst && requestedAfterCursor === firstPageNextCursor;

  const more = useInfiniteQuery({
    queryKey: feedShelfMoreQueryKey(shelf.key, firstPageNextCursor),
    queryFn: ({ pageParam }) => getFeedShelfPage(shelf.key, pageParam),
    initialPageParam: firstPageNextCursor,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: isLoadMoreRequested,
  });

  const loadedMorePages = isLoadMoreRequested ? (more.data?.pages ?? []) : [];
  const items = dedupeByReactionId([...shelf.items, ...loadedMorePages.flatMap((page) => page.items)]);

  // 이어 불러온 페이지가 있으면 마지막 페이지 기준으로, 아직 없으면 첫 페이지 기준으로 다음이 있는지 본다
  const hasLoadedMorePages = loadedMorePages.length > 0;
  const hasMore = hasLoadedMorePages ? more.hasNextPage : hasPagesAfterFirst;
  const isLoadingMore = isLoadMoreRequested && (more.isPending || more.isFetchingNextPage);
  const isLoadMoreError = isLoadMoreRequested && more.isError;

  const loadMore = () => {
    // 실패한 뒤에는 자동으로 다시 부르지 않는다(화면에 계속 보이는 동안 반복 호출 방지). retryLoadMore로 다시 시도한다
    if (!hasPagesAfterFirst || isLoadMoreError) return;
    if (!isLoadMoreRequested) {
      setRequestedAfterCursor(firstPageNextCursor);
      return;
    }
    if (more.hasNextPage && !more.isFetching) void more.fetchNextPage();
  };

  const retryLoadMore = () => {
    if (isLoadMoreRequested) void more.refetch();
  };

  return { items, hasMore, isLoadingMore, isLoadMoreError, loadMore, retryLoadMore };
};
