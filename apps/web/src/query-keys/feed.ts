import type { FeedShelfKey } from '@repo/dto/values';

/** 피드 쿼리 전체. 이 키로 무효화하면 선반과 이어 불러온 페이지가 함께 새로 고쳐진다 */
export const feedQueryKey = ['feed'] as const;

/** 홈 선반 목록(선반마다 첫 페이지) */
export const feedShelvesQueryKey = [...feedQueryKey, 'shelves'] as const;

/** 선반 하나를 startCursor 다음부터 이어 불러온 페이지들. 첫 페이지가 바뀌면 키도 바뀐다 */
export const feedShelfMoreQueryKey = (shelf: FeedShelfKey, startCursor?: string) => [...feedQueryKey, 'shelf-more', shelf, startCursor] as const;
