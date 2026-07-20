import { renderHook, act } from '@testing-library/react';

import usePostDetailUxLog from './usePostDetailUxLog';

jest.mock('@/utils/logQueue', () => ({ enqueueLog: jest.fn() }));

const { enqueueLog } = jest.requireMock('@/utils/logQueue') as { enqueueLog: jest.Mock };

const baseOptions = {
  enabled: true,
  postId: 'post-1',
  userId: 'user-1',
  isPlaying: false,
  currentMusicId: null as string | null,
  postMusicIds: ['music-1'],
};

describe('usePostDetailUxLog', () => {
  beforeEach(() => {
    enqueueLog.mockClear();
  });

  it('emit()을 두 번 연속 호출해도 로그 전송은 1회만 발생한다(emitOnce 가드)', () => {
    const { result } = renderHook(() => usePostDetailUxLog(baseOptions));

    act(() => {
      result.current.emit();
      result.current.emit();
    });

    expect(enqueueLog).toHaveBeenCalledTimes(1);
  });

  it('비로그인(userId 없음) 상태에서는 emit()을 호출해도 로그가 전송되지 않는다', () => {
    const { result } = renderHook(() => usePostDetailUxLog({ ...baseOptions, userId: null }));

    act(() => {
      result.current.emit();
    });

    expect(enqueueLog).not.toHaveBeenCalled();
  });

  it('recordPlayedMusic으로 기록한 곡의 수가 playedMusicCount에 정확히 반영된다(중복 제거)', () => {
    const { result } = renderHook(() => usePostDetailUxLog(baseOptions));

    act(() => {
      result.current.recordPlayedMusic('music-1');
      result.current.recordPlayedMusic('music-2');
      result.current.recordPlayedMusic('music-1');
      result.current.emit();
    });

    expect(enqueueLog).toHaveBeenCalledTimes(1);
    const event = enqueueLog.mock.calls[0][0];
    expect(event.meta.playedMusicCount).toBe(2);
  });

  it('postId가 바뀌면(같은 세션에서 다른 게시글로 전환) 상태가 초기화되어 다시 emit할 수 있다', () => {
    const { result, rerender } = renderHook((props: typeof baseOptions) => usePostDetailUxLog(props), {
      initialProps: baseOptions,
    });

    act(() => {
      result.current.emit();
    });
    expect(enqueueLog).toHaveBeenCalledTimes(1);

    rerender({ ...baseOptions, postId: 'post-2' });

    act(() => {
      result.current.emit();
    });
    expect(enqueueLog).toHaveBeenCalledTimes(2);
  });

  it('이 게시글의 음악을 재생 중이면 listenMsByMusic에 재생 시간이 누적된다', async () => {
    const { result } = renderHook(() => usePostDetailUxLog({ ...baseOptions, isPlaying: true, currentMusicId: 'music-1' }));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 1100));
    });

    act(() => {
      result.current.emit();
    });

    const event = enqueueLog.mock.calls[0][0];
    expect(event.meta.listenMsByMusic['music-1']).toBeGreaterThan(0);
  });

  it('다른 게시글의 음악을 재생 중이면 listenMsByMusic에 누적되지 않는다', async () => {
    const { result } = renderHook(() => usePostDetailUxLog({ ...baseOptions, isPlaying: true, currentMusicId: 'other-music' }));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 1100));
    });

    act(() => {
      result.current.emit();
    });

    const event = enqueueLog.mock.calls[0][0];
    expect(event.meta.listenMsByMusic['other-music']).toBeUndefined();
    expect(event.meta.listenMsByMusic['music-1']).toBeUndefined();
  });
});
