import { render, act } from '@testing-library/react';
import type { MusicResponseDto as Music } from '@repo/dto';

import RightPanel from './RightPanel';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { seedAuthMe } from '@/test-utils/authMeTestUtils';
import { createTestQueryClient, createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';

/**
 * player-subscription-boundary CP1 — 리팩터링(CP2에서 구독 경계 정리) 착수 전
 * RightPanel이 자식에게 전달하는 정확한 prop 셋을 고정한다. CP2 이후에는 이 props
 * 대부분이 사라지고(자식이 직접 구독) 이 테스트는 새 계약으로 갱신된다.
 */

const nowPlayingSpy = jest.fn();
const miniPlayerBarSpy = jest.fn();
const queueListSpy = jest.fn();

jest.mock('./NowPlaying', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    nowPlayingSpy(props);
    return <div data-testid="now-playing-mock" />;
  },
}));

jest.mock('./MiniPlayerBar', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    miniPlayerBarSpy(props);
    return <div data-testid="mini-player-bar-mock" />;
  },
}));

jest.mock('./QueueList', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    queueListSpy(props);
    return <div data-testid="queue-list-mock" />;
  },
}));

jest.mock('@/api/internal/auth', () => ({
  authMe: jest.fn(),
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

describe('RightPanel — 자식 prop 전달 특성화 테스트 (player-subscription-boundary CP1)', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = createTestQueryClient();
    seedAuthMe(queryClient, { userId: null, isAuthenticated: false });
    usePlayerStore.setState({ queue: [mockMusic], currentMusic: mockMusic, isPlaying: true });
  });

  it('[현재 구조] NowPlaying과 MiniPlayerBar가 동일한 재생 상태 7개 값을 각각 전달받는다', () => {
    render(<RightPanel />, { wrapper: createQueryClientWrapper(queryClient) });

    const nowPlayingProps = nowPlayingSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    const miniPlayerBarProps = miniPlayerBarSpy.mock.calls[0]?.[0] as Record<string, unknown>;

    const sharedKeys = ['currentMusic', 'isPlaying', 'canPrev', 'canNext'] as const;
    for (const key of sharedKeys) {
      expect(nowPlayingProps[key]).toEqual(miniPlayerBarProps[key]);
    }

    // 콜백도 같은 zustand action을 그대로 전달한다(참조 동일)
    expect(nowPlayingProps.onPrev).toBe(miniPlayerBarProps.onPrev);
    expect(nowPlayingProps.onNext).toBe(miniPlayerBarProps.onNext);
  });

  it('[현재 구조] 재생 상태가 바뀌면 NowPlaying과 MiniPlayerBar 둘 다 다시 렌더된다(리렌더 이중화)', () => {
    render(<RightPanel />, { wrapper: createQueryClientWrapper(queryClient) });

    const nowPlayingCallsBefore = nowPlayingSpy.mock.calls.length;
    const miniPlayerBarCallsBefore = miniPlayerBarSpy.mock.calls.length;

    act(() => {
      usePlayerStore.setState({ isPlaying: false });
    });

    expect(nowPlayingSpy.mock.calls.length).toBeGreaterThan(nowPlayingCallsBefore);
    expect(miniPlayerBarSpy.mock.calls.length).toBeGreaterThan(miniPlayerBarCallsBefore);
  });

  it('[현재 구조] QueueList는 큐 조작 콜백 8개를 RightPanel로부터 전달받는다', () => {
    render(<RightPanel />, { wrapper: createQueryClientWrapper(queryClient) });

    const queueListProps = queueListSpy.mock.calls[0]?.[0] as Record<string, unknown>;

    expect(Object.keys(queueListProps).sort()).toEqual(
      ['queue', 'currentMusicId', 'onClear', 'onRemove', 'onMoveUp', 'onMoveDown', 'onMove', 'onSelect'].sort(),
    );
  });
});
