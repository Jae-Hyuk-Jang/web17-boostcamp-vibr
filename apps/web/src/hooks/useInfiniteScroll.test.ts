import { renderHook, waitFor } from '@testing-library/react';
import { useInView } from 'react-intersection-observer';

import useInfiniteScroll from './useInfiniteScroll';

jest.mock('react-intersection-observer', () => ({
  useInView: jest.fn(),
}));

const mockUseInView = useInView as jest.Mock;

describe('useInfiniteScroll', () => {
  beforeEach(() => {
    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: false });
  });

  it('마운트 시 최초 1회 초기 데이터를 로드한다', async () => {
    const fetchFn = jest.fn().mockResolvedValue({ items: ['a', 'b'], hasNext: true, nextCursor: 'c1' });
    const { result } = renderHook(() => useInfiniteScroll({ fetchFn }));

    expect(result.current.isInitialLoading).toBe(true);
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(result.current.items).toEqual(['a', 'b']);
    expect(result.current.hasNext).toBe(true);
    expect(result.current.errorMsg).toBeNull();
  });

  it('isInView가 true가 되면 nextCursor로 추가 페이지를 불러와 items에 이어붙인다', async () => {
    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce({ items: ['a'], hasNext: true, nextCursor: 'c1' })
      .mockResolvedValueOnce({ items: ['b'], hasNext: false, nextCursor: undefined });

    const { result, rerender } = renderHook(() => useInfiniteScroll({ fetchFn }));
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));

    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: true });
    rerender();

    await waitFor(() => expect(result.current.items).toEqual(['a', 'b']), { timeout: 2000 });
    expect(fetchFn).toHaveBeenNthCalledWith(2, 'c1');
    expect(result.current.hasNext).toBe(false);
  });

  it('hasNext가 false면 isInView가 true여도 추가 로드를 하지 않는다', async () => {
    const fetchFn = jest.fn().mockResolvedValue({ items: ['a'], hasNext: false, nextCursor: undefined });
    const { result, rerender } = renderHook(() => useInfiniteScroll({ fetchFn }));
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));

    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: true });
    rerender();

    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('추가 로드 실패 시 errorMsg가 설정되고, 다음 트리거에서 재시도한다', async () => {
    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce({ items: ['a'], hasNext: true, nextCursor: 'c1' })
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce({ items: ['b'], hasNext: false, nextCursor: undefined });

    const { result, rerender } = renderHook(() => useInfiniteScroll({ fetchFn }));
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));

    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: true });
    rerender();

    await waitFor(() => expect(result.current.errorMsg).toBe('오류가 발생했습니다.'), { timeout: 2000 });
    expect(result.current.items).toEqual(['a']);
    expect(result.current.hasNext).toBe(true);

    // 같은 isInView=true 상태에서는 재호출되지 않으므로, 트리거를 다시 발생시킨다.
    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: false });
    rerender();
    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: true });
    rerender();

    await waitFor(() => expect(result.current.items).toEqual(['a', 'b']), { timeout: 2000 });
    expect(result.current.errorMsg).toBeNull();
  });

  it('resetKey가 변경되면 전체 상태를 초기화한 뒤 다시 초기 로드한다', async () => {
    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce({ items: ['a'], hasNext: true, nextCursor: 'c1' })
      .mockResolvedValueOnce({ items: ['x'], hasNext: false, nextCursor: undefined });

    const { result, rerender } = renderHook(({ resetKey }: { resetKey: string }) => useInfiniteScroll({ fetchFn, resetKey }), {
      initialProps: { resetKey: 'first' },
    });
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    expect(result.current.items).toEqual(['a']);

    rerender({ resetKey: 'second' });

    await waitFor(() => expect(result.current.items).toEqual(['x']), { timeout: 2000 });
    expect(result.current.hasNext).toBe(false);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});
