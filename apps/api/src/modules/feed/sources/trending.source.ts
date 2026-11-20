import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Post } from 'src/modules/post/entities/post.entity';
import { TrendingService } from 'src/modules/trending/trending.service';
import { Repository } from 'typeorm';
import { FeedPage, FeedPageRequest, FeedSource } from './feed-source.interface';
import { joinPublicPlaylistWithMusics } from './public-playlist.query';

type RankedPost = { postId: string; score: number };

const CURSOR_SEPARATOR = ':';

/** 마지막으로 보여 준 항목의 점수와 id. 점수가 같은 항목이 페이지 경계에서 반복되지 않게 id도 함께 쓴다 */
const toTrendingCursor = ({ score, postId }: RankedPost) =>
  `${score}${CURSOR_SEPARATOR}${postId}`;

const parseTrendingCursor = (cursor: string): RankedPost => {
  const [scoreText = '', postId = ''] = cursor.split(CURSOR_SEPARATOR);
  const score = Number(scoreText);
  if (scoreText.trim() === '' || !Number.isFinite(score) || !isUUID(postId, 7))
    throw new BadRequestException('잘못된 피드 커서입니다.');
  return { score, postId };
};

/**
 * Redis는 점수가 같으면 id 역순으로 준다. 커서 항목 다음부터 남긴다.
 * (점수가 더 낮거나, 점수가 같고 id가 더 작은 것)
 */
const isRankedAfter = (member: RankedPost, last: RankedPost) =>
  member.score < last.score ||
  (member.score === last.score && member.postId < last.postId);

/** 지금 인기: 인기 점수가 높은 순서. 비공개로 바뀐 것은 빠진다 */
@Injectable()
export class TrendingSource implements FeedSource {
  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
    private readonly trendingService: TrendingService,
  ) {}

  async getPage({ limit, cursor }: FeedPageRequest): Promise<FeedPage> {
    const last = cursor === undefined ? undefined : parseTrendingCursor(cursor);

    const candidates = await this.trendingService.getByMaxScore(last?.score);
    const ranked = (
      last
        ? candidates.filter((member) => isRankedAfter(member, last))
        : candidates
    ).slice(0, limit + 1);

    // limit + 1번째가 있으면 다음 페이지가 있다
    const shown = ranked.slice(0, limit);
    const nextCursor =
      ranked.length > limit
        ? toTrendingCursor(shown[shown.length - 1]!)
        : undefined;

    if (shown.length === 0) return { posts: [] };

    const postIds = shown.map((member) => member.postId);
    const posts = await joinPublicPlaylistWithMusics(
      this.postRepository.createQueryBuilder('post'),
    )
      .andWhere('post.id IN (:...postIds)', { postIds })
      .getMany();

    // id 목록으로 다시 조회하면 순서가 사라지므로 인기 점수 순서로 되돌린다
    const rankOf = new Map(postIds.map((id, index) => [id, index]));
    return {
      posts: posts.toSorted((a, b) => rankOf.get(a.id)! - rankOf.get(b.id)!),
      nextCursor,
    };
  }
}
