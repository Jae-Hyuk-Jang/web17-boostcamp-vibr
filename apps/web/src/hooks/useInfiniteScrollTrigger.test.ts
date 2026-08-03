import { renderHook } from '@testing-library/react';
import { useInView } from 'react-intersection-observer';

import { useInfiniteScrollTrigger } from './useInfiniteScrollTrigger';

jest.mock('react-intersection-observer', () => ({
  useInView: jest.fn(),
}));

const mockUseInView = useInView as jest.Mock;

describe('useInfiniteScrollTrigger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('화면에 보이고 다음 페이지가 있고 로딩 중이 아니면 fetchNextPage를 호출한다', () => {
    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: true });
    const fetchNextPage = jest.fn();

    renderHook(() => useInfiniteScrollTrigger({ hasNextPage: true, isFetchingNextPage: false, fetchNextPage }));

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('화면에 보이지 않으면 fetchNextPage를 호출하지 않는다', () => {
    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: false });
    const fetchNextPage = jest.fn();

    renderHook(() => useInfiniteScrollTrigger({ hasNextPage: true, isFetchingNextPage: false, fetchNextPage }));

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('다음 페이지가 없으면 fetchNextPage를 호출하지 않는다', () => {
    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: true });
    const fetchNextPage = jest.fn();

    renderHook(() => useInfiniteScrollTrigger({ hasNextPage: false, isFetchingNextPage: false, fetchNextPage }));

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('이미 로딩 중이면 fetchNextPage를 호출하지 않는다', () => {
    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: true });
    const fetchNextPage = jest.fn();

    renderHook(() => useInfiniteScrollTrigger({ hasNextPage: true, isFetchingNextPage: true, fetchNextPage }));

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('ref를 반환한다', () => {
    const mockRef = jest.fn();
    mockUseInView.mockReturnValue({ ref: mockRef, inView: false });

    const { result } = renderHook(() => useInfiniteScrollTrigger({ hasNextPage: true, isFetchingNextPage: false, fetchNextPage: jest.fn() }));

    expect(result.current).toBe(mockRef);
  });
});
