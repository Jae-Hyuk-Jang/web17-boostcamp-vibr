import { TrendingSource } from '../sources/trending.source';
import { Post } from 'src/modules/post/entities/post.entity';
import { TrendingService } from 'src/modules/trending/trending.service';
import { Repository } from 'typeorm';

type MockQueryBuilder = {
  leftJoinAndSelect: jest.Mock;
  andWhere: jest.Mock;
  take: jest.Mock;
  getMany: jest.Mock;
};

describe('TrendingSource (mock only)', () => {
  const trendingService = { getByMaxScore: jest.fn() };
  const postRepository = { createQueryBuilder: jest.fn() };

  const makeQb = (): MockQueryBuilder => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockReturnThis(),
  });

  const makeMembers = (scores: number[]) => {
    return scores.map((s, i) => ({ postId: `p${i + 1}`, score: s }));
  };

  let source: TrendingSource;

  beforeEach(() => {
    jest.clearAllMocks();

    source = new TrendingSource(
      postRepository as unknown as Repository<Post>,
      trendingService as unknown as TrendingService,
    );
  });

  it('비초기 + cursor 없으면 posts:[] 즉시 반환', async () => {
    // when
    const res = await source.getPosts(false, 'u1', 10, undefined);

    // then
    expect(res).toEqual({ posts: [] });
    expect(trendingService.getByMaxScore).not.toHaveBeenCalled();
  });

  it('cursor 숫자 파싱해서 getByMaxScore에 maxScoreExclusive 전달', async () => {
    // given
    trendingService.getByMaxScore.mockResolvedValue(makeMembers([50, 40]));

    const qb = makeQb();
    qb.getMany.mockResolvedValue([]);
    postRepository.createQueryBuilder.mockReturnValue(qb);

    // when
    await source.getPosts(true, null, 1, '123');

    expect(trendingService.getByMaxScore).toHaveBeenCalledWith(123);
  });

  it('인기 점수순 상위 limit개를 조회하고 limit+1번째 점수를 nextCursor로 반환', async () => {
    // given
    trendingService.getByMaxScore.mockResolvedValue(
      makeMembers([100, 90, 80, 70, 60]),
    );

    const qb = makeQb();
    qb.getMany.mockResolvedValue([]); // hydrate 결과는 여기서 테스트 X
    postRepository.createQueryBuilder.mockReturnValue(qb);

    // when
    const res = await source.getPosts(true, 'u1', 3, undefined);

    // then
    expect(qb.andWhere).toHaveBeenCalledWith('post.id IN (:...postIds)', {
      postIds: ['p1', 'p2', 'p3'],
    });
    expect(res.nextCursor).toBe('70');
  });

  it('조회된 인기글이 limit 이하면 nextCursor 없음', async () => {
    // given
    trendingService.getByMaxScore.mockResolvedValue(makeMembers([100, 90]));

    const qb = makeQb();
    qb.getMany.mockResolvedValue([]);
    postRepository.createQueryBuilder.mockReturnValue(qb);

    // when
    const res = await source.getPosts(true, 'u1', 3, undefined);

    // then
    expect(qb.andWhere).toHaveBeenCalledWith('post.id IN (:...postIds)', {
      postIds: ['p1', 'p2'],
    });
    expect(res.nextCursor).toBeUndefined();
  });
});
