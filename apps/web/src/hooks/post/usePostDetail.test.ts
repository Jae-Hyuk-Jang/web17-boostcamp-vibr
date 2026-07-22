import { renderHook, waitFor } from '@testing-library/react';
import type { PostResponseDto as Post } from '@repo/dto';

import { usePostDetail } from './usePostDetail';
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

describe('usePostDetail — 게시글 상세 재요청 특성화·계약 테스트 (#139)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passedPost가 postId와 일치하면 fetch를 건너뛰고 즉시 반환한다 (FeedList/FeedView 진입 경로)', () => {
    const post = mockPost();
    const { result } = renderHook(() => usePostDetail({ enabled: true, postId: 'post-1', passedPost: post }), {
      wrapper: createQueryClientWrapper(),
    });

    expect(result.current.post).toEqual(post);
    expect(result.current.isLoading).toBe(false);
    expect(getPostDetail).not.toHaveBeenCalled();
  });

  it('passedPost 없이 postId만 넘기면 getPostDetail을 호출해 상세를 받아온다', async () => {
    const post = mockPost();
    getPostDetail.mockResolvedValue(post);

    const { result } = renderHook(() => usePostDetail({ enabled: true, postId: 'post-1' }), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => expect(result.current.post).toEqual(post));
    expect(getPostDetail).toHaveBeenCalledWith('post-1');
    expect(getPostDetail).toHaveBeenCalledTimes(1);
  });

  it('getPostDetail 실패 시 post는 null, error에 메시지가 채워진다', async () => {
    getPostDetail.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => usePostDetail({ enabled: true, postId: 'post-1' }), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.post).toBeNull();
    expect(result.current.error).toBe('network error');
  });

  it('[이슈 1 재현 테스트 통과 전환 — #139] 같은 postId가 이미(passedPost로) 다른 곳에서 페칭됐으면, postId만으로 여는 다음 진입점(ProfilePosts/NotiDrawerContent/PostCard 편집)은 캐시를 재사용해 재요청하지 않는다', async () => {
    const post = mockPost();
    getPostDetail.mockResolvedValue(post);

    const queryClient = createTestQueryClient();
    const wrapper = createQueryClientWrapper(queryClient);

    // 1) FeedList/FeedView처럼 passedPost와 함께 먼저 열림 — fetch 없이 즉시 표시, 캐시에 시딩됨
    const first = renderHook(() => usePostDetail({ enabled: true, postId: 'post-1', passedPost: post }), { wrapper });
    expect(getPostDetail).not.toHaveBeenCalled();
    first.unmount();

    // 2) ProfilePosts/NotiDrawerContent/PostCard(편집)처럼 postId만으로 같은 게시글을 다시 열어도,
    //    같은 QueryClient·queryKey(['postDetail', postId])를 공유하므로 캐시를 즉시 재사용한다.
    const second = renderHook(() => usePostDetail({ enabled: true, postId: 'post-1' }), { wrapper });

    expect(second.result.current.post).toEqual(post);
    expect(second.result.current.isLoading).toBe(false);
    expect(getPostDetail).not.toHaveBeenCalled();
  });

  it('[캐시 미스] 다른 QueryClient(=별도 세션)에서는 캐시를 공유하지 않아 다시 요청한다', async () => {
    const post = mockPost();
    getPostDetail.mockResolvedValue(post);

    const first = renderHook(() => usePostDetail({ enabled: true, postId: 'post-1', passedPost: post }), {
      wrapper: createQueryClientWrapper(),
    });
    expect(getPostDetail).not.toHaveBeenCalled();
    first.unmount();

    const second = renderHook(() => usePostDetail({ enabled: true, postId: 'post-1' }), {
      wrapper: createQueryClientWrapper(),
    });
    await waitFor(() => expect(second.result.current.post).toEqual(post));
    expect(getPostDetail).toHaveBeenCalledTimes(1);
  });
});
