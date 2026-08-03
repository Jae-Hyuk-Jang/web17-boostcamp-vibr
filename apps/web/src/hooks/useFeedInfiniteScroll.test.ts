import { renderHook, waitFor } from '@testing-library/react';
import { useInView } from 'react-intersection-observer';
import type { PostResponseDto as Post, FeedResponseDto } from '@repo/dto';

import useFeedInfiniteScroll from './useFeedInfiniteScroll';

jest.mock('react-intersection-observer', () => ({
  useInView: jest.fn(),
}));

const mockUseInView = useInView as jest.Mock;

const mockPost = (overrides: Partial<Post> = {}): Post => ({
  id: 'post-1',
  author: { id: 'author-1', nickname: 'author', profileImgUrl: null },
  coverImgUrl: '',
  musics: [],
  content: 'content',
  likeCount: 0,
  commentCount: 0,
  createdAt: new Date().toISOString(),
  isEdited: false,
  isLiked: false,
  ...overrides,
});

describe('useFeedInfiniteScroll', () => {
  beforeEach(() => {
    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: false });
  });

  it('마운트 시 최초 1회 초기 데이터를 커서 없이 로드한다', async () => {
    const postA = mockPost({ id: 'a' });
    const response: FeedResponseDto = {
      posts: [postA],
      hasNext: true,
      nextCursor: { following: 'f1', trending: 't1', recent: 'r1' },
    };
    const fetchFn = jest.fn().mockResolvedValue(response);

    const { result } = renderHook(() => useFeedInfiniteScroll({ fetchFn }));
    expect(result.current.isInitialLoading).toBe(true);

    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledWith();
    expect(result.current.posts).toEqual([postA]);
    expect(result.current.hasNext).toBe(true);
  });

  it('initialData가 있으면 최초 fetch 완료 전에도 해당 게시글이 posts에 시딩되어 있다', () => {
    const seeded = mockPost({ id: 'shared-post' });
    const fetchFn = jest.fn().mockResolvedValue({ posts: [], hasNext: false, nextCursor: undefined } as FeedResponseDto);

    const { result } = renderHook(() => useFeedInfiniteScroll({ fetchFn, initialData: [seeded] }));

    expect(result.current.posts).toEqual([seeded]);
  });

  it('isInView가 true가 되면 이전 응답의 nextCursor(다중 소스 커서)를 그대로 넘겨 다음 페이지를 요청한다', async () => {
    const postA = mockPost({ id: 'a' });
    const postB = mockPost({ id: 'b' });
    const cursor1 = { following: 'f1', trending: 't1', recent: 'r1' };

    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce({ posts: [postA], hasNext: true, nextCursor: cursor1 } as FeedResponseDto)
      .mockResolvedValueOnce({ posts: [postB], hasNext: false, nextCursor: undefined } as FeedResponseDto);

    const { result, rerender } = renderHook(() => useFeedInfiniteScroll({ fetchFn }));
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));

    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: true });
    rerender();

    await waitFor(() => expect(result.current.posts).toEqual([postA, postB]), { timeout: 2000 });
    expect(fetchFn).toHaveBeenNthCalledWith(2, cursor1);
  });

  it('다음 페이지에 이전 페이지와 같은 postId가 섞여 있으면 dedupePosts로 중복을 제거한다', async () => {
    const postA = mockPost({ id: 'a', content: 'original' });
    const postADuplicate = mockPost({ id: 'a', content: 'updated' });
    const postB = mockPost({ id: 'b' });

    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce({ posts: [postA], hasNext: true, nextCursor: { following: 'f1' } } as FeedResponseDto)
      .mockResolvedValueOnce({ posts: [postADuplicate, postB], hasNext: false, nextCursor: undefined } as FeedResponseDto);

    const { result, rerender } = renderHook(() => useFeedInfiniteScroll({ fetchFn }));
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));

    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: true });
    rerender();

    await waitFor(() => expect(result.current.posts).toHaveLength(2), { timeout: 2000 });
    expect(result.current.posts.map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('resetKey가 변경되면 posts/커서를 초기화한 뒤 다시 초기 로드한다', async () => {
    const postA = mockPost({ id: 'a' });
    const postX = mockPost({ id: 'x' });

    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce({ posts: [postA], hasNext: true, nextCursor: { following: 'f1' } } as FeedResponseDto)
      .mockResolvedValueOnce({ posts: [postX], hasNext: false, nextCursor: undefined } as FeedResponseDto);

    const { result, rerender } = renderHook(({ resetKey }: { resetKey: string }) => useFeedInfiniteScroll({ fetchFn, resetKey }), {
      initialProps: { resetKey: 'first' },
    });
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    expect(result.current.posts).toEqual([postA]);

    rerender({ resetKey: 'second' });

    await waitFor(() => expect(result.current.posts).toEqual([postX]), { timeout: 2000 });
    expect(result.current.hasNext).toBe(false);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});
