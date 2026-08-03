import { renderHook } from '@testing-library/react';
import { useQueryClient } from '@tanstack/react-query';
import type { PostResponseDto as Post } from '@repo/dto';

import { usePostCacheSync } from './usePostCacheSync';
import { postDetailQueryKey } from './usePostDetail';
import { createTestQueryClient, createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';

jest.mock('@/api/internal/post', () => ({
  getPostDetail: jest.fn(),
}));

const { getPostDetail } = jest.requireMock('@/api/internal/post') as { getPostDetail: jest.Mock };

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

describe('usePostCacheSync — 경량 캐시 구독 훅 계약(#153)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initialData(전달받은 post)를 즉시 노출한다', () => {
    const post = mockPost();
    const { result } = renderHook(() => usePostCacheSync(post.id, post), { wrapper: createQueryClientWrapper() });

    expect(result.current.post).toEqual(post);
    expect(getPostDetail).not.toHaveBeenCalled();
  });

  it('자체적으로 fetch하지 않는다(enabled:false) — 캐시에 이미 값이 있어도 getPostDetail을 호출하지 않는다', () => {
    const post = mockPost();
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(postDetailQueryKey(post.id), post);

    renderHook(() => usePostCacheSync(post.id, post), { wrapper: createQueryClientWrapper(queryClient) });

    expect(getPostDetail).not.toHaveBeenCalled();
  });

  it('다른 곳에서 같은 postId의 캐시를 setQueryData로 갱신하면 그 값을 반영한다', () => {
    const post = mockPost();
    const queryClient = createTestQueryClient();

    const { result, rerender } = renderHook(
      () => {
        const sync = usePostCacheSync(post.id, post);
        const qc = useQueryClient();
        return { sync, qc };
      },
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    expect(result.current.sync.post.likeCount).toBe(0);

    queryClient.setQueryData(postDetailQueryKey(post.id), { ...post, likeCount: 5, isLiked: true });
    rerender();

    expect(result.current.sync.post.likeCount).toBe(5);
    expect(result.current.sync.post.isLiked).toBe(true);
  });
});
