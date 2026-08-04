import { renderHook, waitFor } from '@testing-library/react';

import { useAuthMe } from './useAuthMe';
import usePostReactions from '@/hooks/post/usePostReactions';
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

describe('authMe 중복 호출 계약 테스트 (#139) — useAuthMe과 usePostReactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authMe.mockResolvedValue({ id: 'me', nickname: 'me', profileImgUrl: null });
    getComments.mockResolvedValue({ comments: [] });
  });

  it('useAuthMe()와 usePostReactions가 같은 authMe 쿼리 캐시(["authMe"])를 공유해, 네트워크 호출이 총 1회로 합쳐진다 (auth-state-ownership #233)', async () => {
    const queryClient = createTestQueryClient();
    const wrapper = createQueryClientWrapper(queryClient);

    const { result: authMeResult } = renderHook(() => useAuthMe(), { wrapper });
    const { result: reactionsResult } = renderHook(
      () => usePostReactions({ enabled: true, postId: 'post-1', initialIsLiked: false, initialLikeCount: 0 }),
      { wrapper },
    );

    await waitFor(() => expect(authMeResult.current.isAuthenticated).toBe(true));
    await waitFor(() => expect(reactionsResult.current.isAuthenticated).toBe(true));

    // useAuthStore 미러 스토어가 제거된 이후에도, 같은 QueryClient·queryKey(['authMe'])를 공유하므로
    // 여러 소비처가 있어도 네트워크 호출은 1회로 유지된다.
    expect(authMe).toHaveBeenCalledTimes(1);
  });
});
