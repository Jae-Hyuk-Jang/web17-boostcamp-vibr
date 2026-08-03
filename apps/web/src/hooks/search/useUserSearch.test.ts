import { renderHook, waitFor } from '@testing-library/react';
import { useInView } from 'react-intersection-observer';

import useUserSearch from './useUserSearch';
import { createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';

jest.mock('react-intersection-observer', () => ({
  useInView: jest.fn(),
}));

jest.mock('@/api/internal/user', () => ({
  searchUsers: jest.fn(),
}));

const mockUseInView = useInView as jest.Mock;
const { searchUsers } = jest.requireMock('@/api/internal/user') as { searchUsers: jest.Mock };

describe('useUserSearch — 검색 초기 로드 실패 시 에러 상태 노출(#149에서 initialError 죽은 상태 정정)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: false });
  });

  it('검색 초기 로드가 실패하면 status가 "error"가 된다 (수정 전에는 initialError 죽은 상태 때문에 "empty"로 귀결됐음)', async () => {
    searchUsers.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useUserSearch({ query: 'abcd', debounceMs: 0 }), { wrapper: createQueryClientWrapper() });

    await waitFor(() => expect(searchUsers).toHaveBeenCalled());
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.errorMessage).toBeTruthy();
    expect(result.current.results).toHaveLength(0);
  });

  it('검색 성공 시 결과가 반영되고 status가 success가 된다', async () => {
    searchUsers.mockResolvedValue({ users: [{ id: 'u1', nickname: 'user1', profileImgUrl: null }], hasNext: false, nextCursor: undefined });

    const { result } = renderHook(() => useUserSearch({ query: 'abcd', debounceMs: 0 }), { wrapper: createQueryClientWrapper() });

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.results).toHaveLength(1);
  });

  it('최소 글자수 미만이면 검색을 호출하지 않고 status는 idle이다', async () => {
    const { result } = renderHook(() => useUserSearch({ query: 'a', debounceMs: 0, minQueryLength: 2 }), { wrapper: createQueryClientWrapper() });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(searchUsers).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('결과가 없으면 status가 empty가 된다', async () => {
    searchUsers.mockResolvedValue({ users: [], hasNext: false, nextCursor: undefined });

    const { result } = renderHook(() => useUserSearch({ query: 'abcd', debounceMs: 0 }), { wrapper: createQueryClientWrapper() });

    await waitFor(() => expect(result.current.status).toBe('empty'));
  });

  it('검색어가 바뀌면 이전 결과를 초기화하고 새 검색어로 재조회한다(resetKey)', async () => {
    searchUsers.mockResolvedValueOnce({ users: [{ id: 'u1', nickname: 'first', profileImgUrl: null }], hasNext: false, nextCursor: undefined });

    const { result, rerender } = renderHook(({ query }: { query: string }) => useUserSearch({ query, debounceMs: 0 }), {
      initialProps: { query: 'abcd' },
      wrapper: createQueryClientWrapper(),
    });
    await waitFor(() => expect(result.current.results).toHaveLength(1));

    searchUsers.mockResolvedValueOnce({ users: [{ id: 'u2', nickname: 'second', profileImgUrl: null }], hasNext: false, nextCursor: undefined });
    rerender({ query: 'zzzz' });

    await waitFor(() => expect(result.current.trimmedQuery).toBe('zzzz'));
    await waitFor(() => expect(result.current.results.map((u) => u.id)).toEqual(['u2']));
  });
});
