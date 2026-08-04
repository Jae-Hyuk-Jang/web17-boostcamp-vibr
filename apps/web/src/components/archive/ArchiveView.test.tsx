import { render, waitFor } from '@testing-library/react';

import ArchiveView from './ArchiveView';
import { PLAYLISTS_QUERY_KEY } from '@/query-keys';
import { createTestQueryClient, createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';

jest.mock('@/api', () => ({
  deletePlaylist: jest.fn(),
  editTitleOfPlaylist: jest.fn(),
  createNewPlaylist: jest.fn(),
}));

jest.mock('@/api/internal', () => ({
  getAllPlaylists: jest.fn(),
}));

const { getAllPlaylists } = jest.requireMock('@/api/internal') as { getAllPlaylists: jest.Mock };

describe('ArchiveView — usePlaylists(TanStack Query) 구독 계약 테스트 (#139)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAllPlaylists.mockResolvedValue([]);
  });

  it('마운트 시 getAllPlaylists를 1회 호출한다', async () => {
    render(<ArchiveView />, { wrapper: createQueryClientWrapper() });
    await waitFor(() => expect(getAllPlaylists).toHaveBeenCalledTimes(1));
  });

  it('[정상 동작 — 이슈 3 전환 후] 다른 곳에서 플레이리스트 캐시가 무효화되면 목록을 다시 불러온다', async () => {
    const queryClient = createTestQueryClient();
    render(<ArchiveView />, { wrapper: createQueryClientWrapper(queryClient) });
    await waitFor(() => expect(getAllPlaylists).toHaveBeenCalledTimes(1));

    await queryClient.invalidateQueries({ queryKey: PLAYLISTS_QUERY_KEY });

    await waitFor(() => expect(getAllPlaylists).toHaveBeenCalledTimes(2));
  });
});
