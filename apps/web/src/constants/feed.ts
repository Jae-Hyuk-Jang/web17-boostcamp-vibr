import { FeedShelfKey } from '@repo/dto/values';

/** 선반 제목. 어떤 선반을 어떤 순서로 보여 줄지는 서버가 정한다 */
export const FEED_SHELF_TITLES: Record<FeedShelfKey, string> = {
  [FeedShelfKey.FOLLOWING]: '팔로우한 사람',
  [FeedShelfKey.TRENDING]: '지금 인기',
  [FeedShelfKey.RECENT]: '새로 올라온',
};

/**
 * 선반 카드 폭(144px, md 이상 176px). 카드와 로딩 자리 표시가 같이 쓴다.
 * 폭을 바꾸면 바로 아래 커버 이미지 sizes도 같은 값으로 바꾼다.
 */
export const FEED_SHELF_CARD_WIDTH_CLASS_NAME = 'w-36 md:w-44';

/** 위 카드 폭에 맞춘 커버 이미지 sizes(next/image) */
export const FEED_SHELF_CARD_IMAGE_SIZES = '(min-width: 768px) 176px, 144px';
