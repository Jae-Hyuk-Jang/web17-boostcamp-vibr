'use client';

import { useFeedShelves } from '@/hooks';
import { FeedSkeleton } from '../skeleton';
import FeedShelf from './FeedShelf';

/** 홈 피드: 서버가 정한 순서대로 출처별 선반을 보여 준다 */
export default function FeedView() {
  const { data, isPending, isError, refetch } = useFeedShelves();

  if (isPending) return <FeedSkeleton />;

  if (isError) {
    return (
      <div className="py-16 text-center">
        <p className="font-bold text-primary">피드를 불러오지 못했습니다.</p>
        <button type="button" onClick={() => void refetch()} className="mt-3 text-sm font-bold text-primary underline">
          다시 시도
        </button>
      </div>
    );
  }

  if (data.shelves.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-bold text-primary">아직 공개된 플레이리스트가 없어요.</p>
        <p className="mt-2 text-sm text-gray-500">첫 플레이리스트를 공유해 보세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-10 py-6 md:py-8">
      {data.shelves.map((shelf) => (
        <FeedShelf key={shelf.key} shelf={shelf} />
      ))}
    </div>
  );
}
