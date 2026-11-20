import { Injectable } from '@nestjs/common';
import { toPostResponseDto } from '../post/post.mapper';
import { Post } from '../post/entities/post.entity';
import { PostResponseDto, FeedResponseDto, Cursor } from '@repo/dto';
import { FollowingSource } from './sources/following.source';
import { TrendingSource } from './sources/trending.source';
import { RecentSource } from './sources/recent.source';
import { SourceAllocationPolicy } from './policy/source-allocation.policy';
import { FeedCompositionPolicy } from './policy/feed-composition.policy';

@Injectable()
export class FeedService {
  constructor(
    private readonly followingSource: FollowingSource,
    private readonly trendingSource: TrendingSource,
    private readonly recentSource: RecentSource,

    private readonly sourceAllocationPolicy: SourceAllocationPolicy,
    private readonly feedCompositionPolicy: FeedCompositionPolicy,
  ) {}

  async feed(
    requestUserId: string | null,
    limit: number,
    cursor?: Cursor,
  ): Promise<FeedResponseDto> {
    const isInitialRequest = this.isInitialCursor(cursor);

    const {
      followingLimit,
      trendingLimit,
      recentLimit: initialRecentLimit,
    } = this.sourceAllocationPolicy.allocate(limit);
    let recentLimit = initialRecentLimit;

    // 팔로잉 글 (+ 내 글)과 인기 게시글을 병렬로 조회
    const [
      { posts: followingPosts, nextCursor: nextFollowingCursor },
      { posts: trendingPosts, nextCursor: nextTrendingCursor },
    ] = await Promise.all([
      this.followingSource.getPosts(
        isInitialRequest,
        requestUserId,
        followingLimit,
        cursor?.following,
      ),
      this.trendingSource.getPosts(
        isInitialRequest,
        requestUserId,
        trendingLimit,
        cursor?.trending,
      ),
    ]);

    // 덜 조회된 팔로잉 글 수만큼 최신글을 더 조회
    const followingShortage = followingLimit - followingPosts.length;
    recentLimit += followingShortage;

    // 최신글
    const { posts: recentPosts, nextCursor: nextRecentCursor } =
      await this.recentSource.getPosts(
        isInitialRequest,
        requestUserId,
        recentLimit,
        cursor?.recent,
      );

    // 합치기
    const posts = this.feedCompositionPolicy.compose(
      followingPosts,
      trendingPosts,
      recentPosts,
    );

    return {
      hasNext:
        !!nextFollowingCursor || !!nextTrendingCursor || !!nextRecentCursor,
      nextCursor: {
        following: nextFollowingCursor,
        trending: nextTrendingCursor,
        recent: nextRecentCursor,
      },
      posts: this.mapToFeedResponseDto(posts),
    };
  }

  private isInitialCursor(cursor?: Cursor) {
    return (
      !cursor ||
      (cursor.following === undefined &&
        cursor.trending === undefined &&
        cursor.recent === undefined)
    );
  }

  private mapToFeedResponseDto(posts: Post[]): PostResponseDto[] {
    // isLiked: 요청자의 좋아요만 조인했으므로 결과가 있으면 true
    return posts.map((post) =>
      toPostResponseDto(post, !!(post.likes && post.likes.length > 0)),
    );
  }
}
