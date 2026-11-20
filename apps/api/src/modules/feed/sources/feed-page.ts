import { BadRequestException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { Post } from 'src/modules/post/entities/post.entity';
import { FeedPage } from './feed-source.interface';

/** limit + 1개를 조회한 결과를 한 페이지와 다음 커서로 나눈다 */
export const toFeedPage = (
  fetched: Post[],
  limit: number,
  toCursor: (lastPost: Post) => string,
): FeedPage => {
  if (fetched.length <= limit) return { posts: fetched };
  const posts = fetched.slice(0, limit);
  return { posts, nextCursor: toCursor(posts[posts.length - 1]!) };
};

/** 반응 기록 id(UUIDv7, 만든 순서) 커서 */
export const parsePostIdCursor = (cursor: string): string => {
  if (!isUUID(cursor, 7))
    throw new BadRequestException('잘못된 피드 커서입니다.');
  return cursor;
};
