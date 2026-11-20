import { FeedShelfKey } from '@repo/dto/values';
import { Post } from 'src/modules/post/entities/post.entity';
import { FeedService } from '../feed.service';
import { FollowingSource } from '../sources/following.source';
import { TrendingSource } from '../sources/trending.source';
import { RecentSource } from '../sources/recent.source';
import { FEED_SHELF_MAX_SIZE } from '../feed.constants';

const makePost = (id: string, coverUrls: string[] = ['cover-a']) =>
  ({
    id,
    playlist: {
      id: `playlist-${id}`,
      title: `제목 ${id}`,
      customCoverUrl: null,
      owner: { id: 'owner-1', nickname: '주인', profileImgUrl: 'profile' },
      playlistMusics: coverUrls
        .map((albumCoverUrl, orderIndex) => ({
          orderIndex,
          music: {
            id: `m${orderIndex}`,
            title: `곡 ${orderIndex}`,
            artistName: 'a',
            albumCoverUrl,
            trackUri: 'uri',
            provider: 'itunes',
            durationMs: 1000,
          },
        }))
        .reverse(), // 조인 결과 순서에 기대지 않는지 확인
    },
  }) as unknown as Post;

describe('FeedService', () => {
  const following = { getPage: jest.fn() };
  const trending = { getPage: jest.fn() };
  const recent = { getPage: jest.fn() };
  let service: FeedService;

  beforeEach(() => {
    jest.clearAllMocks();
    following.getPage.mockResolvedValue({ posts: [] });
    trending.getPage.mockResolvedValue({ posts: [] });
    recent.getPage.mockResolvedValue({ posts: [] });
    service = new FeedService(
      following as unknown as FollowingSource,
      trending as unknown as TrendingSource,
      recent as unknown as RecentSource,
    );
  });

  it('선반을 팔로우한 사람, 지금 인기, 새로 올라온 순서로 돌려준다', async () => {
    following.getPage.mockResolvedValue({ posts: [makePost('f')] });
    trending.getPage.mockResolvedValue({
      posts: [makePost('t')],
      nextCursor: 'tc',
    });
    recent.getPage.mockResolvedValue({ posts: [makePost('r')] });

    const { shelves } = await service.getShelves('me', 12);

    expect(shelves.map((s) => s.key)).toEqual([
      FeedShelfKey.FOLLOWING,
      FeedShelfKey.TRENDING,
      FeedShelfKey.RECENT,
    ]);
    expect(shelves[1]!.nextCursor).toBe('tc');
    expect(following.getPage).toHaveBeenCalledWith({
      requestUserId: 'me',
      limit: 12,
      cursor: undefined,
    });
  });

  it('비어 있는 선반은 뺀다', async () => {
    recent.getPage.mockResolvedValue({ posts: [makePost('r')] });

    const { shelves } = await service.getShelves(null, 12);

    expect(shelves.map((s) => s.key)).toEqual([FeedShelfKey.RECENT]);
  });

  it('카드에 플레이리스트 요약, 소유자, 곡 순서대로의 곡 목록, 반응 기록 id를 담는다', async () => {
    recent.getPage.mockResolvedValue({
      posts: [makePost('p1', ['a', 'b', 'c', 'd'])],
    });

    const { items } = await service.getShelfPage(FeedShelfKey.RECENT, null, 12);

    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.reactionId).toBe('p1');
    expect(item!.playlist).toEqual({
      id: 'playlist-p1',
      title: '제목 p1',
      coverImageUrls: ['a', 'b', 'c', 'd'],
      tracksCount: 4,
    });
    expect(item!.owner).toEqual({
      id: 'owner-1',
      nickname: '주인',
      profileImgUrl: 'profile',
    });
    expect(item!.musics.map((m) => m.title)).toEqual([
      '곡 0',
      '곡 1',
      '곡 2',
      '곡 3',
    ]);
  });

  it('선반 하나를 이어서 불러올 때 커서를 그대로 넘긴다', async () => {
    await service.getShelfPage(FeedShelfKey.TRENDING, 'me', 12, 'c1');

    expect(trending.getPage).toHaveBeenCalledWith({
      requestUserId: 'me',
      limit: 12,
      cursor: 'c1',
    });
  });

  it.each([
    [0, 1],
    [999, FEED_SHELF_MAX_SIZE],
  ])('요청한 개수 %d는 %d로 맞춘다', async (requested, expected) => {
    await service.getShelfPage(FeedShelfKey.RECENT, null, requested);

    expect(recent.getPage).toHaveBeenCalledWith(
      expect.objectContaining({ limit: expected }),
    );
  });
});
