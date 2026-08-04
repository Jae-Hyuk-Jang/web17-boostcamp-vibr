import { renderHook, waitFor } from '@testing-library/react';
import type { GetUserDto as Profile } from '@repo/dto';

import { useProfile } from './useProfile';
import { profileQueryKey } from '@/query-keys';
import { createTestQueryClient, createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';

jest.mock('@/api/internal', () => ({
  getUser: jest.fn(),
}));

const { getUser } = jest.requireMock('@/api/internal') as { getUser: jest.Mock };

const mockProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: 'user-1',
  nickname: '닉네임',
  profileImgUrl: null,
  bio: '',
  followerCount: 0,
  followingCount: 0,
  isFollowing: false,
  ...overrides,
});

describe('useProfile — 공용 쿼리 훅 (profile-info-caching #199)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('마운트되면 getUser를 userId로 1회 호출해 결과를 반환한다', async () => {
    const profile = mockProfile();
    getUser.mockResolvedValue(profile);

    const { result } = renderHook(() => useProfile('user-1'), { wrapper: createQueryClientWrapper() });

    await waitFor(() => expect(result.current.data).toEqual(profile));
    expect(getUser).toHaveBeenCalledWith('user-1');
    expect(getUser).toHaveBeenCalledTimes(1);
  });

  it('실패 시 isError가 true가 된다', async () => {
    getUser.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useProfile('user-1'), { wrapper: createQueryClientWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('enabled: false면 fetch하지 않는다', () => {
    const { result } = renderHook(() => useProfile('user-1', false), { wrapper: createQueryClientWrapper() });

    expect(result.current.isPending).toBe(true);
    expect(getUser).not.toHaveBeenCalled();
  });

  it('staleTime(60초) 내에는 같은 userId를 다시 마운트해도 재요청하지 않는다 — 캐시 공유 계약', async () => {
    const queryClient = createTestQueryClient();
    const profile = mockProfile();
    getUser.mockResolvedValue(profile);

    const { result: first, unmount } = renderHook(() => useProfile('user-1'), { wrapper: createQueryClientWrapper(queryClient) });
    await waitFor(() => expect(first.current.data).toEqual(profile));
    unmount();

    const { result: second } = renderHook(() => useProfile('user-1'), { wrapper: createQueryClientWrapper(queryClient) });

    expect(second.current.data).toEqual(profile);
    expect(getUser).toHaveBeenCalledTimes(1);
  });

  it('profileQueryKey는 userId별로 구분된 키를 만든다', () => {
    expect(profileQueryKey('user-1')).toEqual(['profile', 'user-1']);
    expect(profileQueryKey('user-2')).toEqual(['profile', 'user-2']);
  });

  it('서로 다른 userId를 연속 조회해도 캐시가 섞이지 않는다 — userId 격리 계약 (profile-info-caching #206, Success Criteria)', async () => {
    const queryClient = createTestQueryClient();
    const profileA = mockProfile({ id: 'user-a', nickname: 'A' });
    const profileB = mockProfile({ id: 'user-b', nickname: 'B' });
    getUser.mockImplementation((userId: string) => Promise.resolve(userId === 'user-a' ? profileA : profileB));

    const { result: resultA } = renderHook(() => useProfile('user-a'), { wrapper: createQueryClientWrapper(queryClient) });
    const { result: resultB } = renderHook(() => useProfile('user-b'), { wrapper: createQueryClientWrapper(queryClient) });

    await waitFor(() => expect(resultA.current.data).toEqual(profileA));
    await waitFor(() => expect(resultB.current.data).toEqual(profileB));

    // 두 캐시가 서로 값을 덮어쓰지 않았는지 재확인
    expect(queryClient.getQueryData(profileQueryKey('user-a'))).toEqual(profileA);
    expect(queryClient.getQueryData(profileQueryKey('user-b'))).toEqual(profileB);
  });
});
