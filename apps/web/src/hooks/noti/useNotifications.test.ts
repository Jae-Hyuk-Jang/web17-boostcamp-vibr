import { renderHook, waitFor, act } from '@testing-library/react';
import type { NotiResponseDto } from '@repo/dto';

import useNotifications, { notiQueryKey } from './useNotifications';
import { useAuthStore } from '@/stores';
import { createTestQueryClient, createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';

jest.mock('@/api', () => ({
  fetchNotis: jest.fn(),
  markNotiRead: jest.fn(),
  markAllNotiRead: jest.fn(),
  deleteAllNotis: jest.fn(),
}));

const { fetchNotis, markNotiRead, markAllNotiRead, deleteAllNotis } = jest.requireMock('@/api') as {
  fetchNotis: jest.Mock;
  markNotiRead: jest.Mock;
  markAllNotiRead: jest.Mock;
  deleteAllNotis: jest.Mock;
};

const mockNoti = (overrides: Partial<NotiResponseDto> = {}): NotiResponseDto =>
  ({
    id: 'noti-1',
    isRead: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  }) as NotiResponseDto;

describe('useNotifications — 알림 폴링/낙관적 갱신 특성화 테스트 (TanStack Query 전환)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ userId: null, isAuthenticated: false, isLoading: true });
  });

  it('비로그인 상태면 조회 없이 status가 no-login이다', () => {
    useAuthStore.setState({ userId: null, isAuthenticated: false, isLoading: false });

    const { result } = renderHook(() => useNotifications(), { wrapper: createQueryClientWrapper() });

    expect(result.current.status).toBe('no-login');
    expect(fetchNotis).not.toHaveBeenCalled();
  });

  it('인증 로딩 중이면(isLoading=true) no-login 상태로 취급하고 조회하지 않는다', () => {
    useAuthStore.setState({ userId: null, isAuthenticated: false, isLoading: true });

    renderHook(() => useNotifications(), { wrapper: createQueryClientWrapper() });

    expect(fetchNotis).not.toHaveBeenCalled();
  });

  it('로그인 상태면 알림을 조회하고 unreadCount를 파생한다', async () => {
    useAuthStore.setState({ userId: 'me', isAuthenticated: true, isLoading: false });
    fetchNotis.mockResolvedValue([mockNoti({ id: 'a', isRead: false }), mockNoti({ id: 'b', isRead: true })]);

    const { result } = renderHook(() => useNotifications(), { wrapper: createQueryClientWrapper() });

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.notis).toHaveLength(2);
    expect(result.current.unreadCount).toBe(1);
  });

  it('조회 실패 시 status가 error이고 errorMessage가 채워진다', async () => {
    useAuthStore.setState({ userId: 'me', isAuthenticated: true, isLoading: false });
    fetchNotis.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useNotifications(), { wrapper: createQueryClientWrapper() });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.errorMessage).toBe('network error');
  });

  it('readNoti 성공 시 해당 알림만 낙관적으로 isRead=true가 되고 unreadCount가 줄어든다', async () => {
    useAuthStore.setState({ userId: 'me', isAuthenticated: true, isLoading: false });
    markNotiRead.mockResolvedValue(undefined);
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(notiQueryKey, [mockNoti({ id: 'a', isRead: false }), mockNoti({ id: 'b', isRead: false })]);

    const { result } = renderHook(() => useNotifications(), { wrapper: createQueryClientWrapper(queryClient) });

    act(() => {
      result.current.readNoti('a');
    });

    await waitFor(() => expect(markNotiRead).toHaveBeenCalledWith('a'));
    await waitFor(() => expect(result.current.notis.find((n) => n.id === 'a')?.isRead).toBe(true));
    expect(result.current.notis.find((n) => n.id === 'b')?.isRead).toBe(false);
    expect(result.current.unreadCount).toBe(1);
  });

  it('readNoti 실패 시 낙관적으로 반영했던 변경이 롤백된다', async () => {
    useAuthStore.setState({ userId: 'me', isAuthenticated: true, isLoading: false });
    markNotiRead.mockRejectedValue(new Error('network error'));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(notiQueryKey, [mockNoti({ id: 'a', isRead: false })]);

    const { result } = renderHook(() => useNotifications(), { wrapper: createQueryClientWrapper(queryClient) });

    act(() => {
      result.current.readNoti('a');
    });

    await waitFor(() => expect(result.current.notis.find((n) => n.id === 'a')?.isRead).toBe(false));
    expect(result.current.unreadCount).toBe(1);
  });

  it('readAllNotis 성공 시 모든 알림이 isRead=true가 되고 unreadCount가 0이 된다', async () => {
    useAuthStore.setState({ userId: 'me', isAuthenticated: true, isLoading: false });
    markAllNotiRead.mockResolvedValue(undefined);
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(notiQueryKey, [mockNoti({ id: 'a', isRead: false }), mockNoti({ id: 'b', isRead: false })]);

    const { result } = renderHook(() => useNotifications(), { wrapper: createQueryClientWrapper(queryClient) });

    act(() => {
      result.current.readAllNotis();
    });

    await waitFor(() => expect(result.current.notis.every((n) => n.isRead)).toBe(true));
    expect(result.current.unreadCount).toBe(0);
  });

  it('readAllNotis 실패 시 이전 상태로 롤백된다', async () => {
    useAuthStore.setState({ userId: 'me', isAuthenticated: true, isLoading: false });
    markAllNotiRead.mockRejectedValue(new Error('network error'));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(notiQueryKey, [mockNoti({ id: 'a', isRead: false })]);

    const { result } = renderHook(() => useNotifications(), { wrapper: createQueryClientWrapper(queryClient) });

    act(() => {
      result.current.readAllNotis();
    });

    await waitFor(() => expect(result.current.notis.find((n) => n.id === 'a')?.isRead).toBe(false));
    expect(result.current.unreadCount).toBe(1);
  });

  it('알림이 이미 모두 읽음 상태면 readAllNotis가 API를 호출하지 않는다', async () => {
    useAuthStore.setState({ userId: 'me', isAuthenticated: true, isLoading: false });
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(notiQueryKey, [mockNoti({ id: 'a', isRead: true })]);

    const { result } = renderHook(() => useNotifications(), { wrapper: createQueryClientWrapper(queryClient) });

    act(() => {
      result.current.readAllNotis();
    });

    expect(markAllNotiRead).not.toHaveBeenCalled();
  });

  it('deleteAllNotis 성공 시 알림 목록이 비워진다', async () => {
    useAuthStore.setState({ userId: 'me', isAuthenticated: true, isLoading: false });
    deleteAllNotis.mockResolvedValue(undefined);
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(notiQueryKey, [mockNoti({ id: 'a', isRead: false })]);

    const { result } = renderHook(() => useNotifications(), { wrapper: createQueryClientWrapper(queryClient) });

    act(() => {
      result.current.deleteAllNotis();
    });

    await waitFor(() => expect(result.current.notis).toEqual([]));
    expect(result.current.unreadCount).toBe(0);
  });

  it('deleteAllNotis 실패 시 이전 알림 목록으로 롤백된다', async () => {
    useAuthStore.setState({ userId: 'me', isAuthenticated: true, isLoading: false });
    deleteAllNotis.mockRejectedValue(new Error('network error'));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(notiQueryKey, [mockNoti({ id: 'a', isRead: false })]);

    const { result } = renderHook(() => useNotifications(), { wrapper: createQueryClientWrapper(queryClient) });

    act(() => {
      result.current.deleteAllNotis();
    });

    await waitFor(() => expect(result.current.notis).toHaveLength(1));
    expect(result.current.unreadCount).toBe(1);
  });

  it('알림이 없으면 deleteAllNotis가 API를 호출하지 않는다', () => {
    useAuthStore.setState({ userId: 'me', isAuthenticated: true, isLoading: false });
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(notiQueryKey, []);

    const { result } = renderHook(() => useNotifications(), { wrapper: createQueryClientWrapper(queryClient) });

    act(() => {
      result.current.deleteAllNotis();
    });

    expect(deleteAllNotis).not.toHaveBeenCalled();
  });

  it('[Behavior Invariant] 로그인 상태면 5초마다 알림을 다시 조회한다', async () => {
    jest.useFakeTimers();
    useAuthStore.setState({ userId: 'me', isAuthenticated: true, isLoading: false });
    fetchNotis.mockResolvedValue([]);

    renderHook(() => useNotifications(), { wrapper: createQueryClientWrapper() });

    await act(async () => {
      await Promise.resolve();
    });
    expect(fetchNotis).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
    });
    expect(fetchNotis).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });
});
