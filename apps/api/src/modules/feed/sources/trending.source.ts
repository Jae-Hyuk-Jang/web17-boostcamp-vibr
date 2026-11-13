import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from 'src/modules/post/entities/post.entity';
import { TrendingService } from 'src/modules/trending/trending.service';
import { Repository } from 'typeorm';
import { FeedSource } from './feed-source.interface';

@Injectable()
export class TrendingSource implements FeedSource {
  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
    private readonly trendingService: TrendingService,
  ) {}

  async getPosts(
    isInitialRequest: boolean,
    requestUserId: string | null,
    limit: number,
    cursor?: string,
  ): Promise<{ posts: Post[]; nextCursor?: string }> {
    if (!isInitialRequest && !cursor) return { posts: [] };

    // 인기 점수순으로 limit + 1개까지 조회 (마지막 1개는 다음 페이지 존재 여부 확인용)
    const parsed = cursor ? Number(cursor) : undefined;
    const maxScoreExclusive = Number.isFinite(parsed) ? parsed : undefined;
    const members = await this.getTrendingPostIds(limit, maxScoreExclusive);

    if (!members || members.length === 0) return { posts: [] };

    // nextCursor
    const hasNext = members.length > limit;
    const nextCursor = hasNext ? members[members.length - 1]!.score : undefined;

    // 게시글 조회
    const postIds = members.slice(0, limit).map((m) => m.postId);
    const posts = await this.hydratePosts(requestUserId, postIds, limit);

    return { posts, nextCursor: nextCursor?.toString() };
  }

  private async getTrendingPostIds(
    limit: number,
    maxScoreExclusive?: number,
  ): Promise<{ postId: string; score: number }[]> {
    // 전체 인기글 조회
    const members = await this.trendingService.getByMaxScore(maxScoreExclusive);

    return members.slice(0, limit + 1);
  }

  private async hydratePosts(
    requestUserId: string | null,
    postIds: string[],
    limit: number,
  ): Promise<Post[]> {
    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.postMusics', 'postMusic')
      .leftJoinAndSelect('postMusic.music', 'music');

    // isLiked 확인용 조인
    if (requestUserId) {
      query.leftJoinAndSelect(
        'post.likes',
        'like',
        'like.userId = :requestUserId',
        { requestUserId },
      );
    }

    query.andWhere('post.id IN (:...postIds)', { postIds });

    return await query.take(limit + 1).getMany();
  }
}
