import { render, renderHook, waitFor } from '@testing-library/react';

import { AuthBootstrap } from './AuthBootstrap';
import usePostReactions from '@/hooks/post/usePostReactions';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePostReactionOverridesStore } from '@/stores/usePostReactionOverridesStore';
import { createTestQueryClient, createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';

jest.mock('@/api/internal', () => ({
  getComments: jest.fn(),
  createComment: jest.fn(),
}));

jest.mock('@/api/internal/auth', () => ({
  authMe: jest.fn(),
}));

const { getComments } = jest.requireMock('@/api/internal') as { getComments: jest.Mock };
const { authMe } = jest.requireMock('@/api/internal/auth') as { authMe: jest.Mock };

describe('authMe 중복 호출 계약 테스트 (#139) — AuthBootstrap과 usePostReactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ userId: null, isAuthenticated: false, isLoading: true });
    usePostReactionOverridesStore.setState({ likesByPostId: {}, commentsByPostId: {}, contentByPostId: {}, deletedPostId: null });
    authMe.mockResolvedValue({ id: 'me', nickname: 'me', profileImgUrl: null });
    getComments.mockResolvedValue({ comments: [] });
  });

  it('[이슈 1 재현 테스트 통과 전환 — #139] AuthBootstrap과 usePostReactions가 같은 authMe 쿼리 캐시(["authMe"])를 공유해, 네트워크 호출이 총 1회로 합쳐진다', async () => {
    const queryClient = createTestQueryClient();
    const wrapper = createQueryClientWrapper(queryClient);

    render(<AuthBootstrap />, { wrapper });
    const { result } = renderHook(() => usePostReactions({ enabled: true, postId: 'post-1', initialIsLiked: false, initialLikeCount: 0 }), {
      wrapper,
    });

    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    // 이슈 1에서는 이 두 소비자가 각자 독립적으로 authMe를 호출해 총 2회였다.
    // 이슈 4(authMe를 useQuery로 통합) 이후에는 같은 QueryClient·queryKey(['authMe'])를 공유하므로 1회로 줄어든다.
    expect(authMe).toHaveBeenCalledTimes(1);
  });
});
