import { renderHook, waitFor } from '@testing-library/react';
import type { GetPlaylistDetailResDto } from '@repo/dto';

import { usePlaylistDetail, playlistDetailQueryKey } from './usePlaylistDetail';
import { createTestQueryClient, createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';

jest.mock('@/api/internal', () => ({
  getPlaylistDetail: jest.fn(),
}));

const { getPlaylistDetail } = jest.requireMock('@/api/internal') as { getPlaylistDetail: jest.Mock };

const mockDetail = (overrides: Partial<GetPlaylistDetailResDto> = {}): GetPlaylistDetailResDto => ({
  id: 'pl-1',
  title: '내 플레이리스트',
  musics: [],
  ...overrides,
});

describe('usePlaylistDetail — 공용 쿼리 훅 (playlist-detail-caching #188)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('마운트되면 getPlaylistDetail을 playlistId로 1회 호출해 결과를 반환한다', async () => {
    const detail = mockDetail();
    getPlaylistDetail.mockResolvedValue(detail);

    const { result } = renderHook(() => usePlaylistDetail('pl-1'), { wrapper: createQueryClientWrapper() });

    await waitFor(() => expect(result.current.data).toEqual(detail));
    expect(getPlaylistDetail).toHaveBeenCalledWith('pl-1');
    expect(getPlaylistDetail).toHaveBeenCalledTimes(1);
  });

  it('실패 시 isError가 true가 된다', async () => {
    getPlaylistDetail.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => usePlaylistDetail('pl-1'), { wrapper: createQueryClientWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('enabled: false면 fetch하지 않는다', () => {
    const { result } = renderHook(() => usePlaylistDetail('pl-1', false), { wrapper: createQueryClientWrapper() });

    expect(result.current.isPending).toBe(true);
    expect(getPlaylistDetail).not.toHaveBeenCalled();
  });

  it('staleTime(60초) 내에는 같은 playlistId를 다시 마운트해도 재요청하지 않는다 — 캐시 공유 계약', async () => {
    const queryClient = createTestQueryClient();
    const detail = mockDetail();
    getPlaylistDetail.mockResolvedValue(detail);

    const { result: first, unmount } = renderHook(() => usePlaylistDetail('pl-1'), { wrapper: createQueryClientWrapper(queryClient) });
    await waitFor(() => expect(first.current.data).toEqual(detail));
    unmount();

    const { result: second } = renderHook(() => usePlaylistDetail('pl-1'), { wrapper: createQueryClientWrapper(queryClient) });

    expect(second.current.data).toEqual(detail);
    expect(getPlaylistDetail).toHaveBeenCalledTimes(1);
  });

  it('playlistDetailQueryKey는 playlistId별로 구분된 키를 만든다', () => {
    expect(playlistDetailQueryKey('pl-1')).toEqual(['playlistDetail', 'pl-1']);
    expect(playlistDetailQueryKey('pl-2')).toEqual(['playlistDetail', 'pl-2']);
  });
});
