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

describe('useUserSearch — 검색 초기 로드 실패 시 에러 상태 노출(#149에서 initialError 죽은 상태 정정)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: false });
  });

  it('검색 초기 로드가 실패하면 status가 "error"가 된다 (수정 전에는 initialError 죽은 상태 때문에 "empty"로 귀결됐음)', async () => {
    searchUsers.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useUserSearch({ query: 'abcd', debounceMs: 0 }));

    await waitFor(() => expect(searchUsers).toHaveBeenCalled());
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.errorMessage).toBeTruthy();
    expect(result.current.results).toHaveLength(0);
  });

  it('검색 성공 시 결과가 반영되고 status가 success가 된다', async () => {
    searchUsers.mockResolvedValue({ users: [{ id: 'u1', nickname: 'user1', profileImgUrl: null }], hasNext: false, nextCursor: undefined });

    const { result } = renderHook(() => useUserSearch({ query: 'abcd', debounceMs: 0 }));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.results).toHaveLength(1);
  });
});
