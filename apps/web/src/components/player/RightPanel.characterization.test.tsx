import { render, act } from '@testing-library/react';
import type { MusicResponseDto as Music } from '@repo/dto';

import RightPanel from './RightPanel';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { seedAuthMe } from '@/test-utils/authMeTestUtils';
import { createTestQueryClient, createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';

/**
 * player-subscription-boundary CP2(#263) — 구독 경계 정리 회귀 테스트.
 * CP1에서는 이 파일이 "RightPanel이 자식에게 재생 상태 7개/8개를 재분배한다"는
 * 구 계약을 특성화했다. CP2에서 그 재분배를 없앴으므로, 지금은 반대로
 * "RightPanel이 더 이상 재생 상태를 자식에게 넘기지 않는다"를 회귀 테스트로 고정한다.
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

describe('RightPanel — 구독 경계 정리 회귀 테스트 (player-subscription-boundary CP2 #263)', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = createTestQueryClient();
    seedAuthMe(queryClient, { userId: null, isAuthenticated: false });
    usePlayerStore.setState({ queue: [mockMusic], currentMusic: mockMusic, isPlaying: true });
  });

  it('NowPlaying은 props 없이 렌더된다(재생 상태를 직접 usePlayerNavigation으로 구독)', () => {
    render(<RightPanel />, { wrapper: createQueryClientWrapper(queryClient) });

    const nowPlayingProps = nowPlayingSpy.mock.calls[0]?.[0] as Record<string, unknown>;

    expect(Object.keys(nowPlayingProps)).toHaveLength(0);
  });

  it('QueueList는 props 없이 렌더된다(큐/조작 액션을 직접 usePlayerStore로 구독)', () => {
    render(<RightPanel />, { wrapper: createQueryClientWrapper(queryClient) });

    const queueListProps = queueListSpy.mock.calls[0]?.[0] as Record<string, unknown>;

    expect(Object.keys(queueListProps)).toHaveLength(0);
  });

  it('MiniPlayerBar는 RightPanel 로컬 UI 콜백 2개(onOpenQueue/onOpenFullPlayer)만 전달받는다', () => {
    render(<RightPanel />, { wrapper: createQueryClientWrapper(queryClient) });

    const miniPlayerBarProps = miniPlayerBarSpy.mock.calls[0]?.[0] as Record<string, unknown>;

    expect(Object.keys(miniPlayerBarProps).sort()).toEqual(['onOpenFullPlayer', 'onOpenQueue'].sort());
    expect(typeof miniPlayerBarProps.onOpenQueue).toBe('function');
    expect(typeof miniPlayerBarProps.onOpenFullPlayer).toBe('function');
  });

  it('재생 상태(zustand)가 바뀌어도 RightPanel이 자식에게 새로 전달하는 재생 관련 prop은 여전히 없다', () => {
    render(<RightPanel />, { wrapper: createQueryClientWrapper(queryClient) });

    act(() => {
      usePlayerStore.setState({ isPlaying: false });
    });

    // useGuestQueueSession이 isPlaying을 별도로 구독해 RightPanel 자체는 리렌더될 수 있지만(큐 영속화 목적,
    // 이번 체크포인트 범위 밖), 그로 인해 NowPlaying/QueueList가 다시 받는 props는 여전히 빈 객체다.
    const lastNowPlayingProps = nowPlayingSpy.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    const lastQueueListProps = queueListSpy.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(Object.keys(lastNowPlayingProps)).toHaveLength(0);
    expect(Object.keys(lastQueueListProps)).toHaveLength(0);
  });
});
