import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from 'src/modules/post/entities/post.entity';
import { Repository } from 'typeorm';
import { FeedPage, FeedPageRequest, FeedSource } from './feed-source.interface';
import { parsePostIdCursor, toFeedPage } from './feed-page';
import { joinPublicPlaylistWithMusics } from './public-playlist.query';

/** 팔로우한 사람: 내가 팔로우한 사람의 공개 플레이리스트, 최신 공개순. 비로그인이면 비어 있다 */
@Injectable()
export class FollowingSource implements FeedSource {
  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
  ) {}

  async getPage({
    requestUserId,
    limit,
    cursor,
  }: FeedPageRequest): Promise<FeedPage> {
    if (!requestUserId) return { posts: [] };

    const query = joinPublicPlaylistWithMusics(
      this.postRepository.createQueryBuilder('post'),
    )
      .innerJoin(
        'follow',
        'f',
        'f.followingUserId = :requestUserId AND f.followedUserId = owner.id',
        { requestUserId },
      )
      .orderBy('post.id', 'DESC');

    if (cursor) {
      query.andWhere('post.id < :cursor', {
        cursor: parsePostIdCursor(cursor),
      });
    }

    const fetched = await query.take(limit + 1).getMany();
    return toFeedPage(fetched, limit, (post) => post.id);
  }
}
