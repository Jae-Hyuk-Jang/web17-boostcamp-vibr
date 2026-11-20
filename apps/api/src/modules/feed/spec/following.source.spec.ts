import { Repository } from 'typeorm';
import { Post } from 'src/modules/post/entities/post.entity';
import { FollowingSource } from '../sources/following.source';
import {
  makeQueryBuilderMock,
  postIdOf,
  QueryBuilderMock,
} from './query-builder.mock';

describe('FollowingSource', () => {
  const repo = { createQueryBuilder: jest.fn() };
  let qb: QueryBuilderMock;
  let source: FollowingSource;

  beforeEach(() => {
    jest.clearAllMocks();
    qb = makeQueryBuilderMock();
    qb.getMany.mockResolvedValue([]);
    repo.createQueryBuilder.mockReturnValue(qb);
    source = new FollowingSource(repo as unknown as Repository<Post>);
  });

  it('비로그인이면 조회하지 않고 빈 페이지를 돌려준다', async () => {
    const page = await source.getPage({ requestUserId: null, limit: 10 });

    expect(page).toEqual({ posts: [] });
    expect(repo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('내가 팔로우한 사람이 소유한 공개 플레이리스트만 조회한다(내 것은 넣지 않는다)', async () => {
    await source.getPage({ requestUserId: 'me', limit: 10 });

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(qb.innerJoin).toHaveBeenCalledWith(
      'follow',
      'f',
      'f.followingUserId = :requestUserId AND f.followedUserId = owner.id',
      { requestUserId: 'me' },
    );
    expect(qb.orderBy).toHaveBeenCalledWith('post.id', 'DESC');
  });

  it('커서가 있으면 그보다 먼저 만든 것만 조회한다', async () => {
    const cursor = postIdOf(7);

    await source.getPage({ requestUserId: 'me', limit: 10, cursor });

    expect(qb.andWhere).toHaveBeenCalledWith('post.id < :cursor', { cursor });
  });

  it('limit보다 많으면 잘라서 마지막 id를 다음 커서로 준다', async () => {
    qb.getMany.mockResolvedValue(
      [3, 2, 1].map((n) => ({ id: postIdOf(n) }) as Post),
    );

    const page = await source.getPage({ requestUserId: 'me', limit: 2 });

    expect(qb.take).toHaveBeenCalledWith(3);
    expect(page.posts.map((p) => p.id)).toEqual([3, 2].map(postIdOf));
    expect(page.nextCursor).toBe(postIdOf(2));
  });
});
