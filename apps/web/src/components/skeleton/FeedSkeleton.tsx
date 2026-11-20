import { FEED_SHELF_CARD_WIDTH_CLASS_NAME } from '@/constants';

const SKELETON_SHELF_COUNT = 2;
const SKELETON_CARD_COUNT = 6;

/** 홈 선반 모양의 로딩 표시 */
export default function FeedSkeleton() {
  return (
    <div role="status" aria-label="피드를 불러오는 중" className="space-y-8 md:space-y-10 py-6 md:py-8 overflow-hidden">
      {Array.from({ length: SKELETON_SHELF_COUNT }, (_, shelfIndex) => (
        <div key={shelfIndex} className="animate-pulse">
          <div className="mb-3 mx-4 md:mx-8 h-7 w-32 rounded-md bg-gray-3" />
          <div className="flex gap-4 px-4 md:px-8">
            {Array.from({ length: SKELETON_CARD_COUNT }, (_, cardIndex) => (
              <div key={cardIndex} className={`${FEED_SHELF_CARD_WIDTH_CLASS_NAME} shrink-0`}>
                <div className="aspect-square w-full bg-gray-3" />
                <div className="mt-2 h-4 w-4/5 rounded-md bg-gray-3" />
                <div className="mt-1 h-3 w-1/2 rounded-md bg-gray-3" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
