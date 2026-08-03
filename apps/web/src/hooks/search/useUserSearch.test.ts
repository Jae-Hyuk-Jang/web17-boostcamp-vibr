import { renderHook, waitFor } from '@testing-library/react';
import { useInView } from 'react-intersection-observer';

import useUserSearch from './useUserSearch';

jest.mock('react-intersection-observer', () => ({
  useInView: jest.fn(),
}));

jest.mock('@/api/internal/user', () => ({
  searchUsers: jest.fn(),
}));

const mockUseInView = useInView as jest.Mock;
const { searchUsers } = jest.requireMock('@/api/internal/user') as { searchUsers: jest.Mock };

describe('useUserSearch — initialError 죽은 상태 특성화(#149)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: false });
  });

  it('[버그 스냅샷] 검색 초기 로드가 실패해도 status는 "error"가 되지 않는다 — useInfiniteScroll의 initialError가 항상 null이라 이 분기에 절대 도달하지 못하기 때문', async () => {
    searchUsers.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useUserSearch({ query: 'abcd', debounceMs: 0 }));

    await waitFor(() => expect(searchUsers).toHaveBeenCalled());

    // 현재 구현에서는 initialError가 항상 null이라, 로드가 실패해도 status가 'loading'에서
    // 벗어난 뒤 'empty'로 귀결된다(진짜 에러 상태로는 절대 전이하지 않는다).
    await waitFor(() => expect(result.current.status).toBe('empty'));
    expect(result.current.status).not.toBe('error');
  });

  it('검색 성공 시 결과가 반영되고 status가 success가 된다', async () => {
    searchUsers.mockResolvedValue({ users: [{ id: 'u1', nickname: 'user1', profileImgUrl: null }], hasNext: false, nextCursor: undefined });

    const { result } = renderHook(() => useUserSearch({ query: 'abcd', debounceMs: 0 }));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.results).toHaveLength(1);
  });
});
