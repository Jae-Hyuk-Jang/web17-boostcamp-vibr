import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from 'src/modules/post/entities/post.entity';
import { Repository } from 'typeorm';
import { FeedPage, FeedPageRequest, FeedSource } from './feed-source.interface';
import { parsePostIdCursor, toFeedPage } from './feed-page';
import { joinPublicPlaylistWithMusics } from './public-playlist.query';

/** 새로 올라온: 모든 공개 플레이리스트, 처음 공개한 순서의 역순 */
@Injectable()
export class RecentSource implements FeedSource {
  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
  ) {}

  async getPage({ limit, cursor }: FeedPageRequest): Promise<FeedPage> {
    // 반응 기록은 처음 공개할 때 만들어지고 id(UUIDv7)가 만든 순서를 따른다
    const query = joinPublicPlaylistWithMusics(
      this.postRepository.createQueryBuilder('post'),
    ).orderBy('post.id', 'DESC');

    if (cursor) {
      query.andWhere('post.id < :cursor', {
        cursor: parsePostIdCursor(cursor),
      });
    }

    const fetched = await query.take(limit + 1).getMany();
    return toFeedPage(fetched, limit, (post) => post.id);
  }
}
