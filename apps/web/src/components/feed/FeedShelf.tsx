'use client';

import type { FeedShelfDto } from '@repo/dto';
import { FEED_SHELF_TITLES } from '@/constants';
import { useFeedShelfItems, useInfiniteScrollTrigger } from '@/hooks';
import HorizontalScroller from '../ui/HorizontalScroller';
import LoadingSpinner from '../ui/LoadingSpinner';
import FeedShelfCard from './FeedShelfCard';

type Props = {
  shelf: FeedShelfDto;
};

/** 가로 스크롤 안에서는 선반 끝 표시가 일부만 보이기 쉬워서, 조금이라도 보이면 다음 카드를 불러온다 */
const LOAD_MORE_VISIBLE_RATIO = 0;

/** 출처별 선반 하나: 제목과 가로로 넘기는 카드 줄. 끝에 닿으면 다음 카드를 불러온다 */
export default function FeedShelf({ shelf }: Props) {
  const { items, hasMore, isLoadingMore, isLoadMoreError, loadMore, retryLoadMore } = useFeedShelfItems(shelf);
  const loadMoreRef = useInfiniteScrollTrigger({
    hasNextPage: hasMore,
    isFetchingNextPage: isLoadingMore,
    fetchNextPage: loadMore,
    threshold: LOAD_MORE_VISIBLE_RATIO,
  });

  const title = FEED_SHELF_TITLES[shelf.key];
  const headingId = `feed-shelf-${shelf.key}`;

  return (
    <section aria-labelledby={headingId}>
      <HorizontalScroller
        label={title}
        heading={
          <h2 id={headingId} className="text-xl md:text-2xl font-black text-primary">
            {title}
          </h2>
        }
      >
        {items.map((item) => (
          <FeedShelfCard key={item.reactionId} item={item} />
        ))}
        {hasMore && (
          <div ref={loadMoreRef} className="flex w-20 shrink-0 items-center justify-center">
            {isLoadMoreError && (
              <button type="button" onClick={retryLoadMore} className="text-xs font-bold text-primary underline">
                다시 시도
              </button>
            )}
            {isLoadingMore && <LoadingSpinner hStyle="h-20" />}
          </div>
        )}
      </HorizontalScroller>
    </section>
  );
}
