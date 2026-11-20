import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Post } from 'src/modules/post/entities/post.entity';
import { TrendingService } from 'src/modules/trending/trending.service';
import { TrendingSource } from '../sources/trending.source';
import {
  makeQueryBuilderMock,
  postIdOf,
  QueryBuilderMock,
} from './query-builder.mock';

describe('TrendingSource', () => {
  const trendingService = { getByMaxScore: jest.fn() };
  const repo = { createQueryBuilder: jest.fn() };
  let qb: QueryBuilderMock;
  let source: TrendingSource;

  /** Redis처럼 점수 내림차순, 같은 점수면 id 내림차순으로 준다 */
  const ranked = (...members: [number, number][]) =>
    members.map(([n, score]) => ({ postId: postIdOf(n), score }));

  beforeEach(() => {
    jest.clearAllMocks();
    qb = makeQueryBuilderMock();
    // 조회 결과는 일부러 id 순서로 돌려준다(DB는 IN 조회의 순서를 보장하지 않음)
    qb.getMany.mockImplementation(() => {
      const [, { postIds }] = qb.andWhere.mock.calls[0] as [
        string,
        { postIds: string[] },
      ];
      return Promise.resolve(postIds.toSorted().map((id) => ({ id }) as Post));
    });
    repo.createQueryBuilder.mockReturnValue(qb);
    source = new TrendingSource(
      repo as unknown as Repository<Post>,
      trendingService as unknown as TrendingService,
    );
  });

  it('인기 점수 순서대로 돌려준다', async () => {
    trendingService.getByMaxScore.mockResolvedValue(
      ranked([1, 90], [3, 50], [2, 10]),
    );

    const page = await source.getPage({ requestUserId: null, limit: 10 });

    expect(page.posts.map((p) => p.id)).toEqual([1, 3, 2].map(postIdOf));
    expect(page.nextCursor).toBeUndefined();
  });

  it('limit보다 많으면 마지막으로 보여 준 항목의 점수와 id를 다음 커서로 준다', async () => {
    trendingService.getByMaxScore.mockResolvedValue(
      ranked([1, 90], [3, 50], [2, 10]),
    );

    const page = await source.getPage({ requestUserId: null, limit: 2 });

    expect(page.posts.map((p) => p.id)).toEqual([1, 3].map(postIdOf));
    expect(page.nextCursor).toBe(`50:${postIdOf(3)}`);
  });

  it('점수가 같은 항목이 페이지 경계에 걸려도 반복하거나 빠뜨리지 않는다', async () => {
    // 첫 페이지: 9(점수 5), 8(점수 3)까지 보여 줌. 7, 6도 점수 3
    trendingService.getByMaxScore.mockResolvedValue(
      ranked([8, 3], [7, 3], [6, 3], [5, 1]),
    );

    const page = await source.getPage({
      requestUserId: null,
      limit: 10,
      cursor: `3:${postIdOf(8)}`,
    });

    expect(trendingService.getByMaxScore).toHaveBeenCalledWith(3);
    expect(page.posts.map((p) => p.id)).toEqual([7, 6, 5].map(postIdOf));
  });

  it('비공개로 바뀌어 조회되지 않은 항목은 빠진다', async () => {
    trendingService.getByMaxScore.mockResolvedValue(ranked([1, 90], [2, 50]));
    qb.getMany.mockResolvedValue([{ id: postIdOf(2) } as Post]);

    const page = await source.getPage({ requestUserId: null, limit: 10 });

    expect(page.posts.map((p) => p.id)).toEqual([postIdOf(2)]);
  });

  it('인기 항목이 없으면 조회하지 않는다', async () => {
    trendingService.getByMaxScore.mockResolvedValue([]);

    const page = await source.getPage({ requestUserId: null, limit: 10 });

    expect(page).toEqual({ posts: [] });
    expect(repo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it.each(['abc', '50', `x:${postIdOf(1)}`, '50:not-uuid'])(
    '형식이 잘못된 커서(%s)는 400으로 거절한다',
    async (cursor) => {
      await expect(
        source.getPage({ requestUserId: null, limit: 10, cursor }),
      ).rejects.toBeInstanceOf(BadRequestException);
    },
  );
});
