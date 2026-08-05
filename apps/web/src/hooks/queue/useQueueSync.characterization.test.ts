import { renderHook, act, waitFor } from '@testing-library/react';
import type { MusicResponseDto as Music } from '@repo/dto';

import { useQueueSync } from './useQueueSync';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { getNowPlaylist, updateNowPlaylist } from '@/api/internal/nowPlaylist';

/**
 * player-subscription-boundary CP1 — 리팩터링(CP4에서 TanStack Query 기반 재작성) 착수 전
 * 현재 동작(재시도 없이 영구 중단)을 고정한다. CP4에서 재시도 경로가 생기면 이 테스트는
 * 새 기대값(재시도 시도됨)으로 의도적으로 갱신된다.
 */

jest.mock('@/api/internal/nowPlaylist', () => ({
  getNowPlaylist: jest.fn(),
  updateNowPlaylist: jest.fn(),
}));

const mockMusic: Music = {
  id: 'm1',
  trackUri: 'uri-1',
  provider: 'ITUNES' as Music['provider'],
  albumCoverUrl: 'https://example.com/a.jpg',
  title: 'Test Song',
  artistName: 'Test Artist',
  durationMs: 200000,
};

describe('useQueueSync — 실패 후 영구 중단 특성화 테스트 (player-subscription-boundary CP1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    usePlayerStore.setState({ queue: [], currentMusic: null, isPlaying: false });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('[현재 버그] 최초 로드 실패 후 같은 세션 동안 재시도하지 않는다', async () => {
    (getNowPlaylist as jest.Mock).mockRejectedValue(new Error('network error'));

    const { rerender } = renderHook(({ enabled }) => useQueueSync({ enabled }), { initialProps: { enabled: true } });

    await waitFor(() => expect(getNowPlaylist).toHaveBeenCalledTimes(1));

    // enabled를 다시 true로 줘도(예: 큐 변경으로 인한 리렌더) 이미 실패 처리된 세션에서는 재호출되지 않는다
    rerender({ enabled: true });
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(getNowPlaylist).toHaveBeenCalledTimes(1);
  });

  it('[현재 버그] 업데이트 동기화 실패 후 큐를 다시 바꿔도 더 이상 서버에 반영되지 않는다', async () => {
    (getNowPlaylist as jest.Mock).mockResolvedValue([]);
    (updateNowPlaylist as jest.Mock).mockRejectedValue(new Error('network error'));

    renderHook(() => useQueueSync({ enabled: true }));

    await waitFor(() => expect(getNowPlaylist).toHaveBeenCalledTimes(1));

    act(() => {
      usePlayerStore.setState({ queue: [mockMusic] });
    });
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    await waitFor(() => expect(updateNowPlaylist).toHaveBeenCalledTimes(1));

    // 실패 이후 큐를 또 바꿔도(재시도 경로가 없으므로) 서버에 다시 반영되지 않는다
    act(() => {
      usePlayerStore.setState({ queue: [mockMusic, { ...mockMusic, id: 'm2' }] });
    });
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(updateNowPlaylist).toHaveBeenCalledTimes(1);
  });

  it('큐 동기화가 실패한 상태에서도 로컬 큐 상태(zustand)는 계속 정상 갱신된다', async () => {
    (getNowPlaylist as jest.Mock).mockResolvedValue([]);
    (updateNowPlaylist as jest.Mock).mockRejectedValue(new Error('network error'));

    renderHook(() => useQueueSync({ enabled: true }));
    await waitFor(() => expect(getNowPlaylist).toHaveBeenCalledTimes(1));

    act(() => {
      usePlayerStore.setState({ queue: [mockMusic] });
    });
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    await waitFor(() => expect(updateNowPlaylist).toHaveBeenCalledTimes(1));

    act(() => {
      usePlayerStore.getState().addToQueue({ ...mockMusic, id: 'm2' });
    });

    expect(usePlayerStore.getState().queue).toHaveLength(2);
  });
});
