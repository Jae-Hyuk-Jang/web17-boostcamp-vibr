import { Injectable } from '@nestjs/common';
import type {
  FeedShelfDto,
  FeedShelfPageDto,
  FeedShelvesResponseDto,
} from '@repo/dto';
import { FeedShelfKey } from '@repo/dto/values';
import { FeedSource } from './sources/feed-source.interface';
import { FollowingSource } from './sources/following.source';
import { TrendingSource } from './sources/trending.source';
import { RecentSource } from './sources/recent.source';
import { toFeedShelfItemDto } from './feed-shelf.mapper';
import { FEED_SHELF_MAX_SIZE } from './feed.constants';

/** 홈에 보여 줄 선반 순서 */
const SHELF_ORDER: readonly FeedShelfKey[] = [
  FeedShelfKey.FOLLOWING,
  FeedShelfKey.TRENDING,
  FeedShelfKey.RECENT,
];

const toShelfSize = (limit: number) =>
  Math.min(Math.max(limit, 1), FEED_SHELF_MAX_SIZE);

@Injectable()
export class FeedService {
  private readonly sources: Record<FeedShelfKey, FeedSource>;

  constructor(
    followingSource: FollowingSource,
    trendingSource: TrendingSource,
    recentSource: RecentSource,
  ) {
    this.sources = {
      [FeedShelfKey.FOLLOWING]: followingSource,
      [FeedShelfKey.TRENDING]: trendingSource,
      [FeedShelfKey.RECENT]: recentSource,
    };
  }

  /** 홈 첫 화면: 선반마다 첫 페이지를 모으고, 비어 있는 선반은 뺀다 */
  async getShelves(
    requestUserId: string | null,
    limit: number,
  ): Promise<FeedShelvesResponseDto> {
    const shelves: FeedShelfDto[] = await Promise.all(
      SHELF_ORDER.map(async (key) => ({
        key,
        ...(await this.getShelfPage(key, requestUserId, limit)),
      })),
    );

    return { shelves: shelves.filter((shelf) => shelf.items.length > 0) };
  }

  /** 선반 하나를 커서 다음부터 이어서 불러온다 */
  async getShelfPage(
    key: FeedShelfKey,
    requestUserId: string | null,
    limit: number,
    cursor?: string,
  ): Promise<FeedShelfPageDto> {
    const { posts, nextCursor } = await this.sources[key].getPage({
      requestUserId,
      limit: toShelfSize(limit),
      cursor,
    });

    return { items: posts.map(toFeedShelfItemDto), nextCursor };
  }
}
