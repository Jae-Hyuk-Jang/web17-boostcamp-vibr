import { Post } from 'src/modules/post/entities/post.entity';

export type FeedPageRequest = {
  requestUserId: string | null;
  limit: number;
  /** 이전 페이지가 돌려준 nextCursor. 없으면 첫 페이지 */
  cursor?: string;
};

export type FeedPage = {
  posts: Post[];
  /** 없으면 마지막 페이지 */
  nextCursor?: string;
};

/**
 * 선반 하나의 대상과 순서를 정하는 출처.
 * 새 선반은 이 인터페이스를 구현하고 FeedService의 선반 목록에 등록한다.
 */
export interface FeedSource {
  getPage(request: FeedPageRequest): Promise<FeedPage>;
}
