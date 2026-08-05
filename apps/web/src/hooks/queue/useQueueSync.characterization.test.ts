import { renderHook, act, waitFor } from '@testing-library/react';
import type { MusicResponseDto as Music } from '@repo/dto';

import { useQueueSync } from './useQueueSync';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { getNowPlaylist, updateNowPlaylist } from '@/api/internal/nowPlaylist';
import { createTestQueryClient, createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';

/**
 * player-subscription-boundary CP4(#265) — useQueueSync TanStack Query 전환 회귀 테스트.
 * CP1(이 파일의 이전 버전)에서는 "실패 후 같은 세션 동안 영구히 재시도하지 않는다"는 버그를
 * 특성화했다. CP4에서 useQuery/useMutation의 retry 옵션을 도입해 그 버그를 고쳤으므로,
 * 지금은 반대로 "실패해도 정해진 횟수까지 재시도하고, 이후 큐 변경에서는 다시 시도한다"를
 * 회귀 테스트로 고정한다(의도적인 특성화 테스트 갱신). 1500ms 디바운스 + 재시도 지연이
 * 실제 타이머로 흐르므로 fake timers 대신 waitFor로 검증한다.
 */

jest.setTimeout(15000);

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

describe('useQueueSync — TanStack Query 재시도 회귀 테스트 (player-subscription-boundary CP4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePlayerStore.setState({ queue: [], currentMusic: null, isPlaying: false });
  });

  it('최초 로드가 계속 실패해도 정해진 횟수까지 재시도한다', async () => {
    (getNowPlaylist as jest.Mock).mockRejectedValue(new Error('network error'));

    const queryClient = createTestQueryClient();
    renderHook(() => useQueueSync({ enabled: true }), { wrapper: createQueryClientWrapper(queryClient) });

    // 최초 1회 + retry 2회 = 총 3회
    await waitFor(() => expect(getNowPlaylist).toHaveBeenCalledTimes(3), { timeout: 3000 });
  });

  it('업데이트 동기화가 실패해도 정해진 횟수까지 재시도한다', async () => {
    (getNowPlaylist as jest.Mock).mockResolvedValue([]);
    (updateNowPlaylist as jest.Mock).mockRejectedValue(new Error('network error'));

    const queryClient = createTestQueryClient();
    renderHook(() => useQueueSync({ enabled: true }), { wrapper: createQueryClientWrapper(queryClient) });

    await waitFor(() => expect(getNowPlaylist).toHaveBeenCalledTimes(1));

    act(() => {
      usePlayerStore.setState({ queue: [mockMusic] });
    });

    // 1500ms 디바운스 후 최초 1회 + retry 2회 = 총 3회
    await waitFor(() => expect(updateNowPlaylist).toHaveBeenCalledTimes(3), { timeout: 5000 });
  });

  it('업데이트 실패로 재시도가 소진돼도 다음 큐 변경에서는 다시 시도한다(영구 중단 아님)', async () => {
    (getNowPlaylist as jest.Mock).mockResolvedValue([]);
    (updateNowPlaylist as jest.Mock).mockRejectedValue(new Error('network error'));

    const queryClient = createTestQueryClient();
    renderHook(() => useQueueSync({ enabled: true }), { wrapper: createQueryClientWrapper(queryClient) });

    await waitFor(() => expect(getNowPlaylist).toHaveBeenCalledTimes(1));

    act(() => {
      usePlayerStore.setState({ queue: [mockMusic] });
    });
    await waitFor(() => expect(updateNowPlaylist).toHaveBeenCalledTimes(3), { timeout: 5000 });

    act(() => {
      usePlayerStore.setState({ queue: [mockMusic, { ...mockMusic, id: 'm2' }] });
    });

    // 이전 재시도가 모두 실패해 소진됐어도, 새 큐 변경은 독립된 새 시도를 만든다
    await waitFor(() => expect(updateNowPlaylist).toHaveBeenCalledTimes(6), { timeout: 5000 });
  });

  it('큐 동기화가 실패한 상태에서도 로컬 큐 상태(zustand)는 계속 정상 갱신된다', async () => {
    (getNowPlaylist as jest.Mock).mockResolvedValue([]);
    (updateNowPlaylist as jest.Mock).mockRejectedValue(new Error('network error'));

    const queryClient = createTestQueryClient();
    renderHook(() => useQueueSync({ enabled: true }), { wrapper: createQueryClientWrapper(queryClient) });

    await waitFor(() => expect(getNowPlaylist).toHaveBeenCalledTimes(1));
    // getNowPlaylist가 "호출"된 시점과 그 결과로 initializeQueue가 실행 완료되는 시점 사이에
    // React Query의 내부 상태 전파 턴이 몇 차례 더 필요하다 — 아래에서 addToQueue가 방금 끝난
    // 초기 하이드레이션(빈 배열)에 덮어써지지 않도록 한 틱 더 흘려보낸다.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    act(() => {
      usePlayerStore.getState().addToQueue(mockMusic);
    });

    expect(usePlayerStore.getState().queue).toHaveLength(1);
  });
});
