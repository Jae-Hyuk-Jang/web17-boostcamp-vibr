'use client';

import type { FeedShelfItemDto } from '@repo/dto';
import { Play } from 'lucide-react';
import { PlaylistCover } from '@/components/playlist';
import { FEED_SHELF_CARD_IMAGE_SIZES, FEED_SHELF_CARD_WIDTH_CLASS_NAME } from '@/constants';
import { useFeedShelfCardActions } from '@/hooks';

type Props = {
  item: FeedShelfItemDto;
};

/** 선반 카드: 커버, 제목, 만든 사람만 보여 준다. 소개 글과 좋아요·댓글은 눌렀을 때 상세에서 */
export default function FeedShelfCard({ item }: Props) {
  const { handleOpen, handlePlayAll, handleOwnerClick } = useFeedShelfCardActions();
  const { playlist, owner } = item;
  const hasMusic = item.musics.length > 0;

  return (
    <article className={`${FEED_SHELF_CARD_WIDTH_CLASS_NAME} shrink-0 snap-start`}>
      <div className="group relative">
        <button
          type="button"
          onClick={() => handleOpen(item)}
          aria-label={`${playlist.title} 열기`}
          className="block w-full overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#00EBC7] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-cyan"
        >
          <PlaylistCover title={playlist.title} coverImageUrls={playlist.coverImageUrls} sizes={FEED_SHELF_CARD_IMAGE_SIZES} />
        </button>
        {hasMusic && (
          <button
            type="button"
            onClick={() => handlePlayAll(item)}
            aria-label={`${playlist.title} 전체 재생`}
            className="absolute bottom-2 right-2 flex size-10 items-center justify-center rounded-full border-2 border-primary bg-accent-yellow text-primary shadow-[2px_2px_0px_0px_#00214D] transition-opacity lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Play aria-hidden className="size-5 fill-current" />
          </button>
        )}
      </div>
      <h3 className="mt-2 text-sm font-bold leading-snug text-primary line-clamp-2">{playlist.title}</h3>
      <button
        type="button"
        onClick={() => handleOwnerClick(owner.id)}
        className="block max-w-full truncate text-xs text-gray-500 hover:text-accent-pink"
      >
        {owner.nickname}
      </button>
    </article>
  );
}
