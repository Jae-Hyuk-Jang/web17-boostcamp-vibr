import { renderHook, act, waitFor } from '@testing-library/react';

import usePostLikeToggle from './usePostLikeToggle';
import { usePostReactionOverridesStore } from '@/stores/usePostReactionOverridesStore';

jest.mock('@/api/internal', () => ({
  addLike: jest.fn(),
  removeLike: jest.fn(),
}));

const { addLike, removeLike } = jest.requireMock('@/api/internal') as { addLike: jest.Mock; removeLike: jest.Mock };

describe('usePostLikeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePostReactionOverridesStore.setState({ likesByPostId: {}, commentsByPostId: {}, contentByPostId: {}, deletedPostId: null });
  });

  it('좋아요 토글 성공 시 낙관적으로 반영하고 addLike를 호출하며 override 스토어에 브로드캐스트한다', async () => {
    addLike.mockResolvedValue({});
    const { result } = renderHook(() =>
      usePostLikeToggle({ postId: 'post-1', initialIsLiked: false, initialLikeCount: 3, isAuthenticated: true, resetSubmittingOnSync: false }),
    );

    await act(async () => {
      await result.current.toggleLike();
    });

    expect(addLike).toHaveBeenCalledWith({ postId: 'post-1' });
    expect(result.current.isLiked).toBe(true);
    expect(result.current.likeCount).toBe(4);
    expect(result.current.isSubmitting).toBe(false);
    expect(usePostReactionOverridesStore.getState().likesByPostId['post-1']).toEqual({ isLiked: true, likeCount: 4 });
  });

  it('좋아요 취소(이미 좋아요된 상태) 토글 성공 시 removeLike를 호출한다', async () => {
    removeLike.mockResolvedValue({});
    const { result } = renderHook(() =>
      usePostLikeToggle({ postId: 'post-1', initialIsLiked: true, initialLikeCount: 3, isAuthenticated: true, resetSubmittingOnSync: false }),
    );

    await act(async () => {
      await result.current.toggleLike();
    });

    expect(removeLike).toHaveBeenCalledWith('post-1');
    expect(result.current.isLiked).toBe(false);
    expect(result.current.likeCount).toBe(2);
  });

  it('토글 실패 시 이전 값으로 롤백하고 override 스토어도 롤백된 값으로 되돌린다', async () => {
    addLike.mockRejectedValue(new Error('network error'));
    const { result } = renderHook(() =>
      usePostLikeToggle({ postId: 'post-1', initialIsLiked: false, initialLikeCount: 3, isAuthenticated: true, resetSubmittingOnSync: false }),
    );

    await act(async () => {
      await result.current.toggleLike();
    });

    expect(result.current.isLiked).toBe(false);
    expect(result.current.likeCount).toBe(3);
    expect(usePostReactionOverridesStore.getState().likesByPostId['post-1']).toEqual({ isLiked: false, likeCount: 3 });
  });

  it('비로그인 상태(isAuthenticated=false)에서는 toggleLike가 API를 호출하지 않는다', async () => {
    const { result } = renderHook(() =>
      usePostLikeToggle({ postId: 'post-1', initialIsLiked: false, initialLikeCount: 3, isAuthenticated: false, resetSubmittingOnSync: false }),
    );

    await act(async () => {
      await result.current.toggleLike();
    });

    expect(addLike).not.toHaveBeenCalled();
    expect(removeLike).not.toHaveBeenCalled();
    expect(result.current.isLiked).toBe(false);
  });

  it('제출 중(isSubmitting)에는 재호출을 무시한다', async () => {
    let resolveAddLike!: (v: unknown) => void;
    addLike.mockReturnValue(
      new Promise((resolve) => {
        resolveAddLike = resolve;
      }),
    );

    const { result } = renderHook(() =>
      usePostLikeToggle({ postId: 'post-1', initialIsLiked: false, initialLikeCount: 3, isAuthenticated: true, resetSubmittingOnSync: false }),
    );

    let firstCall!: Promise<void>;
    act(() => {
      firstCall = result.current.toggleLike();
    });
    expect(result.current.isSubmitting).toBe(true);

    await act(async () => {
      await result.current.toggleLike();
    });

    expect(addLike).toHaveBeenCalledTimes(1);

    resolveAddLike({});
    await act(async () => {
      await firstCall;
    });
  });

  it('postId가 바뀌면 initialIsLiked/initialLikeCount로 재동기화되고 isSubmitting이 리셋된다', async () => {
    const { result, rerender } = renderHook(
      ({ postId, initialIsLiked, initialLikeCount }) =>
        usePostLikeToggle({ postId, initialIsLiked, initialLikeCount, isAuthenticated: true, resetSubmittingOnSync: false }),
      { initialProps: { postId: 'post-1', initialIsLiked: false, initialLikeCount: 3 } },
    );

    rerender({ postId: 'post-2', initialIsLiked: true, initialLikeCount: 10 });

    await waitFor(() => expect(result.current.isLiked).toBe(true));
    expect(result.current.likeCount).toBe(10);
    expect(result.current.isSubmitting).toBe(false);
  });
});
