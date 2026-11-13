import { render, screen, act, fireEvent } from '@testing-library/react';
import type { MusicResponseDto as Music } from '@repo/dto';
import { MusicProvider } from '@repo/dto/values';

import RightPanel from './RightPanel';
import { usePlayerStore } from '@/stores/usePlayerStore';

// 열기/닫기 자체의 특성화는 RightPanel.test.tsx가 실제 하위 컴포넌트로 검증한다.
// 이 파일은 "모바일에서 YouTube 곡은 풀 플레이어가 열려 있을 때만 재생" 규칙만 보므로,
// 재생 엔진이 붙는 하위 컴포넌트와 큐 동기화는 대체하고 useYouTubeVisiblePlayback은 실제 구현을 쓴다.
jest.mock('@/hooks', () => {
  const actual = jest.requireActual('@/hooks');
  return {
    ...actual,
    useQueueSync: () => {},
    useGuestQueueSession: () => {},
  };
});

jest.mock('@/hooks/auth/client', () => ({
  useAuthMe: () => ({ isAuthenticated: false, isLoading: true }),
}));

jest.mock('./index', () => ({
  QueueList: () => null,
  NowPlaying: () => <div data-testid="now-playing" />,
  MiniPlayerBar: ({ onOpenFullPlayer }: { onOpenFullPlayer: () => void }) => (
    <button type="button" onClick={onOpenFullPlayer}>
      풀 플레이어 열기
    </button>
  ),
}));

const MOBILE_WIDTH = 375;

const song = (id: string, provider: Music['provider']): Music => ({
  id,
  trackUri: `uri-${id}`,
  provider,
  albumCoverUrl: 'https://example.com/a.jpg',
  title: `Song ${id}`,
  artistName: 'Artist',
  durationMs: 200000,
});

const youtubeSong = song('yt', MusicProvider.YOUTUBE);
const itunesSong = song('it', MusicProvider.ITUNES);

const setViewportWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width });
};

const isFullPlayerOpen = () => screen.queryByTitle('닫기') !== null;

const playOnMobile = (music: Music) => {
  render(<RightPanel />);
  act(() => {
    usePlayerStore.getState().playMusic(music);
  });
};

describe('RightPanel — 모바일에서 YouTube 곡은 풀 플레이어가 열려 있을 때만 재생', () => {
  const originalWidth = window.innerWidth;

  beforeEach(() => {
    setViewportWidth(MOBILE_WIDTH);
    usePlayerStore.setState({ queue: [], currentMusic: null, isPlaying: false });
  });

  afterEach(() => {
    setViewportWidth(originalWidth);
  });

  it('YouTube 곡 재생이 시작되면 풀 플레이어가 열린다', () => {
    playOnMobile(youtubeSong);

    expect(isFullPlayerOpen()).toBe(true);
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });

  it('X 버튼으로 닫으면 YouTube 곡이 일시정지된다', () => {
    playOnMobile(youtubeSong);

    fireEvent.click(screen.getByTitle('닫기'));

    expect(isFullPlayerOpen()).toBe(false);
    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });

  it('ESC로 닫으면 YouTube 곡이 일시정지된다', () => {
    playOnMobile(youtubeSong);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(isFullPlayerOpen()).toBe(false);
    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });

  it('뒤로가기(popstate)로 닫으면 YouTube 곡이 일시정지된다', () => {
    playOnMobile(youtubeSong);

    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(isFullPlayerOpen()).toBe(false);
    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });

  it('아래로 스와이프해서 닫으면 YouTube 곡이 일시정지된다', () => {
    playOnMobile(youtubeSong);
    const section = screen.getByTestId('now-playing').closest('section')!;

    fireEvent.touchStart(section, { touches: [{ clientY: 0 }] });
    fireEvent.touchMove(section, { touches: [{ clientY: 200 }] });

    expect(isFullPlayerOpen()).toBe(false);
    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });

  it('iTunes 곡은 풀 플레이어를 자동으로 열지 않고, 닫아도 계속 재생된다', () => {
    playOnMobile(itunesSong);
    expect(isFullPlayerOpen()).toBe(false);

    fireEvent.click(screen.getByText('풀 플레이어 열기'));
    fireEvent.click(screen.getByTitle('닫기'));

    expect(isFullPlayerOpen()).toBe(false);
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });
});
