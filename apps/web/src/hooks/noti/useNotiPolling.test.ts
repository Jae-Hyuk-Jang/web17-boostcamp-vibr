import { renderHook, act } from '@testing-library/react';

import useNotiPolling from './useNotiPolling';
import { useNotiStore } from '@/stores/useNotiStore';
import { useAuthStore } from '@/stores';

jest.mock('@/api', () => ({
  fetchNotis: jest.fn(),
  markNotiRead: jest.fn(),
  markAllNotiRead: jest.fn(),
  deleteAllNotis: jest.fn(),
}));

const { fetchNotis } = jest.requireMock('@/api') as { fetchNotis: jest.Mock };

describe('useNotiPolling — 알림 폴링 스케줄링 특성화 테스트', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    fetchNotis.mockResolvedValue([]);
    useNotiStore.setState({ notis: [], unreadCount: 0, status: 'idle', errorMessage: null });
    useAuthStore.setState({ userId: null, isAuthenticated: false, isLoading: true });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('로그인 상태면 마운트 시 즉시 알림을 조회하고, 5초마다 다시 조회한다', async () => {
    useAuthStore.setState({ userId: 'me', isAuthenticated: true, isLoading: false });

    renderHook(() => useNotiPolling());

    await act(async () => {
      await Promise.resolve();
    });
    expect(fetchNotis).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
    });
    expect(fetchNotis).toHaveBeenCalledTimes(2);

    await act(async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
    });
    expect(fetchNotis).toHaveBeenCalledTimes(3);
  });

  it('비로그인 상태면 조회 없이 status가 no-login이 되고, 시간이 지나도 조회하지 않는다', async () => {
    useAuthStore.setState({ userId: null, isAuthenticated: false, isLoading: false });

    renderHook(() => useNotiPolling());

    expect(useNotiStore.getState().status).toBe('no-login');

    await act(async () => {
      jest.advanceTimersByTime(10000);
      await Promise.resolve();
    });
    expect(fetchNotis).not.toHaveBeenCalled();
  });

  it('인증 로딩 중이면(isLoading=true) 조회하지 않고 no-login 상태로 취급한다', async () => {
    useAuthStore.setState({ userId: null, isAuthenticated: false, isLoading: true });

    renderHook(() => useNotiPolling());

    expect(useNotiStore.getState().status).toBe('no-login');
    expect(fetchNotis).not.toHaveBeenCalled();
  });

  it('언마운트되면 폴링 인터벌이 정리되어 더 이상 조회하지 않는다', async () => {
    useAuthStore.setState({ userId: 'me', isAuthenticated: true, isLoading: false });

    const { unmount } = renderHook(() => useNotiPolling());

    await act(async () => {
      await Promise.resolve();
    });
    expect(fetchNotis).toHaveBeenCalledTimes(1);

    unmount();

    await act(async () => {
      jest.advanceTimersByTime(10000);
      await Promise.resolve();
    });
    expect(fetchNotis).toHaveBeenCalledTimes(1);
  });
});
