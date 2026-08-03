import { act } from '@testing-library/react';
import type { NotiResponseDto } from '@repo/dto';

import { useNotiStore } from './useNotiStore';

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

describe('useNotiStore — 알림 폴링/낙관적 갱신 특성화 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useNotiStore.setState({ notis: [], unreadCount: 0, status: 'idle', errorMessage: null });
  });

  it('초기 상태는 idle이고 알림 목록이 비어있다', () => {
    const state = useNotiStore.getState();
    expect(state.status).toBe('idle');
    expect(state.notis).toEqual([]);
    expect(state.unreadCount).toBe(0);
    expect(state.errorMessage).toBeNull();
  });

  it('updateNotis 성공 시 notis/unreadCount/status가 채워진다', async () => {
    fetchNotis.mockResolvedValue([mockNoti({ id: 'a', isRead: false }), mockNoti({ id: 'b', isRead: true })]);

    await act(async () => {
      await useNotiStore.getState().updateNotis();
    });

    const state = useNotiStore.getState();
    expect(state.status).toBe('success');
    expect(state.notis).toHaveLength(2);
    expect(state.unreadCount).toBe(1);
  });

  it('updateNotis 실패 시 status가 error로 바뀌고 errorMessage가 채워진다', async () => {
    fetchNotis.mockRejectedValue(new Error('network error'));

    await act(async () => {
      await useNotiStore.getState().updateNotis();
    });

    const state = useNotiStore.getState();
    expect(state.status).toBe('error');
    expect(state.errorMessage).toBe('network error');
  });

  it('setFetchStatus("no-login")으로 비로그인 상태를 표현한다', () => {
    act(() => {
      useNotiStore.getState().setFetchStatus('no-login');
    });

    expect(useNotiStore.getState().status).toBe('no-login');
  });

  it('readNoti 성공 시 해당 알림만 낙관적으로 isRead=true로 바뀌고 unreadCount가 줄어든다', async () => {
    markNotiRead.mockResolvedValue(undefined);
    useNotiStore.setState({
      notis: [mockNoti({ id: 'a', isRead: false }), mockNoti({ id: 'b', isRead: false })],
      unreadCount: 2,
    });

    await act(async () => {
      await useNotiStore.getState().readNoti('a');
    });

    const state = useNotiStore.getState();
    expect(state.notis.find((n) => n.id === 'a')?.isRead).toBe(true);
    expect(state.notis.find((n) => n.id === 'b')?.isRead).toBe(false);
    expect(state.unreadCount).toBe(1);
    expect(markNotiRead).toHaveBeenCalledWith('a');
  });

  it('readNoti 실패 시 낙관적으로 반영했던 변경이 롤백된다', async () => {
    markNotiRead.mockRejectedValue(new Error('network error'));
    useNotiStore.setState({
      notis: [mockNoti({ id: 'a', isRead: false })],
      unreadCount: 1,
    });

    await act(async () => {
      await useNotiStore.getState().readNoti('a');
    });

    const state = useNotiStore.getState();
    expect(state.notis.find((n) => n.id === 'a')?.isRead).toBe(false);
    expect(state.unreadCount).toBe(1);
  });

  it('readAllNotis 성공 시 모든 알림이 isRead=true가 되고 unreadCount가 0이 된다', async () => {
    markAllNotiRead.mockResolvedValue(undefined);
    useNotiStore.setState({
      notis: [mockNoti({ id: 'a', isRead: false }), mockNoti({ id: 'b', isRead: false })],
      unreadCount: 2,
    });

    await act(async () => {
      await useNotiStore.getState().readAllNotis();
    });

    const state = useNotiStore.getState();
    expect(state.notis.every((n) => n.isRead)).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it('readAllNotis 실패 시 이전 상태로 롤백된다', async () => {
    markAllNotiRead.mockRejectedValue(new Error('network error'));
    useNotiStore.setState({
      notis: [mockNoti({ id: 'a', isRead: false })],
      unreadCount: 1,
    });

    await act(async () => {
      await useNotiStore.getState().readAllNotis();
    });

    const state = useNotiStore.getState();
    expect(state.notis.find((n) => n.id === 'a')?.isRead).toBe(false);
    expect(state.unreadCount).toBe(1);
  });

  it('deleteAllNotis 성공 시 알림 목록이 비워진다', async () => {
    deleteAllNotis.mockResolvedValue(undefined);
    useNotiStore.setState({
      notis: [mockNoti({ id: 'a', isRead: false })],
      unreadCount: 1,
    });

    await act(async () => {
      await useNotiStore.getState().deleteAllNotis();
    });

    const state = useNotiStore.getState();
    expect(state.notis).toEqual([]);
    expect(state.unreadCount).toBe(0);
  });

  it('deleteAllNotis 실패 시 이전 알림 목록으로 롤백된다', async () => {
    deleteAllNotis.mockRejectedValue(new Error('network error'));
    useNotiStore.setState({
      notis: [mockNoti({ id: 'a', isRead: false })],
      unreadCount: 1,
    });

    await act(async () => {
      await useNotiStore.getState().deleteAllNotis();
    });

    const state = useNotiStore.getState();
    expect(state.notis).toHaveLength(1);
    expect(state.unreadCount).toBe(1);
  });
});
