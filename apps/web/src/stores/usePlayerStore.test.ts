import type { MusicResponseDto as Music } from '@repo/dto';
import { MusicProvider } from '@repo/dto/values';
import { usePlayerStore } from './usePlayerStore';

const music = (id: string): Music => ({
  id,
  title: `곡 ${id}`,
  artistName: '가수',
  albumCoverUrl: 'cover',
  trackUri: `uri-${id}`,
  provider: MusicProvider.ITUNES,
  durationMs: 1000,
});

const initialState = usePlayerStore.getState();
const queueIds = () => usePlayerStore.getState().queue.map((m) => m.id);

describe('usePlayerStore.playAll — 전체 재생', () => {
  beforeEach(() => {
    usePlayerStore.setState(initialState, true);
  });

  it('곡 목록을 큐 뒤에 붙이고 첫 곡을 재생한다', () => {
    usePlayerStore.setState({ queue: [music('x')] });

    usePlayerStore.getState().playAll([music('a'), music('b')]);

    const { currentMusic, isPlaying } = usePlayerStore.getState();
    expect(queueIds()).toEqual(['x', 'a', 'b']);
    expect(currentMusic?.id).toBe('a');
    expect(isPlaying).toBe(true);
  });

  it('이미 큐에 있던 곡은 뒤로 옮긴다', () => {
    usePlayerStore.setState({ queue: [music('a'), music('x')] });

    usePlayerStore.getState().playAll([music('a'), music('b')]);

    expect(queueIds()).toEqual(['x', 'a', 'b']);
  });

  it('곡이 없으면 아무것도 하지 않는다', () => {
    usePlayerStore.setState({ queue: [music('x')], currentMusic: music('x'), isPlaying: false });

    usePlayerStore.getState().playAll([]);

    const { currentMusic, isPlaying } = usePlayerStore.getState();
    expect(queueIds()).toEqual(['x']);
    expect(currentMusic?.id).toBe('x');
    expect(isPlaying).toBe(false);
  });

  it('첫 곡이 이미 재생 중인 곡이면 재생/일시정지를 토글한다(selectMusic 규칙)', () => {
    usePlayerStore.setState({ queue: [music('a')], currentMusic: music('a'), isPlaying: true });

    usePlayerStore.getState().playAll([music('a'), music('b')]);

    expect(usePlayerStore.getState().isPlaying).toBe(false);
    expect(queueIds()).toEqual(['a', 'b']);
  });
});
