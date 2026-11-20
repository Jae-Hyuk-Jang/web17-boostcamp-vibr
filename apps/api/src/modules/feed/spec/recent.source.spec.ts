import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Post } from 'src/modules/post/entities/post.entity';
import { RecentSource } from '../sources/recent.source';
import {
  makeQueryBuilderMock,
  postIdOf,
  QueryBuilderMock,
} from './query-builder.mock';

describe('RecentSource', () => {
  const repo = { createQueryBuilder: jest.fn() };
  let qb: QueryBuilderMock;
  let source: RecentSource;

  beforeEach(() => {
    jest.clearAllMocks();
    qb = makeQueryBuilderMock();
    qb.getMany.mockResolvedValue([]);
    repo.createQueryBuilder.mockReturnValue(qb);
    source = new RecentSource(repo as unknown as Repository<Post>);
  });

  it('공개 플레이리스트와 소유자를 조인하고 최신순으로 정렬한다', async () => {
    await source.getPage({ requestUserId: null, limit: 10 });

    expect(qb.innerJoinAndSelect).toHaveBeenCalledWith(
      'post.playlist',
      'playlist',
      'playlist.visibility = :publicVisibility',
      { publicVisibility: 'public' },
    );
    expect(qb.innerJoinAndSelect).toHaveBeenCalledWith(
      'playlist.owner',
      'owner',
    );
    expect(qb.orderBy).toHaveBeenCalledWith('post.id', 'DESC');
  });

  it('커서가 있으면 그보다 먼저 만든 것만 조회한다', async () => {
    const cursor = postIdOf(5);

    await source.getPage({ requestUserId: null, limit: 10, cursor });

    expect(qb.andWhere).toHaveBeenCalledWith('post.id < :cursor', { cursor });
  });

  it('형식이 잘못된 커서는 400으로 거절한다', async () => {
    await expect(
      source.getPage({ requestUserId: null, limit: 10, cursor: 'abc' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(qb.getMany).not.toHaveBeenCalled();
  });

  it('limit + 1개를 조회해 limit개만 돌려주고 마지막 id를 다음 커서로 준다', async () => {
    qb.getMany.mockResolvedValue(
      [4, 3, 2, 1].map((n) => ({ id: postIdOf(n) }) as Post),
    );

    const page = await source.getPage({ requestUserId: null, limit: 3 });

    expect(qb.take).toHaveBeenCalledWith(4);
    expect(page.posts.map((p) => p.id)).toEqual([4, 3, 2].map(postIdOf));
    expect(page.nextCursor).toBe(postIdOf(2));
  });

  it('limit개 이하면 다음 커서가 없다', async () => {
    qb.getMany.mockResolvedValue([{ id: postIdOf(1) } as Post]);

    const page = await source.getPage({ requestUserId: null, limit: 3 });

    expect(page.nextCursor).toBeUndefined();
  });
});
