import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useInView } from 'react-intersection-observer';
import type { FeedShelfDto, FeedShelfItemDto, MusicResponseDto } from '@repo/dto';
import { FeedShelfKey, MusicProvider } from '@repo/dto/values';

import FeedView from './FeedView';
import { feedQueryKey } from '@/query-keys';
import { MODAL_TYPES, useModalStore, usePlayerStore } from '@/stores';
import { createTestQueryClient, createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';

jest.mock('react-intersection-observer', () => ({
  useInView: jest.fn(),
}));
const mockUseInView = useInView as jest.Mock;

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/api', () => ({
  getFeedShelves: jest.fn(),
  getFeedShelfPage: jest.fn(),
}));
const { getFeedShelves, getFeedShelfPage } = jest.requireMock('@/api') as {
  getFeedShelves: jest.Mock;
  getFeedShelfPage: jest.Mock;
};

const music = (id: string): MusicResponseDto => ({
  id,
  title: `곡 ${id}`,
  artistName: '가수',
  albumCoverUrl: `https://is1-ssl.mzstatic.com/${id}.jpg`,
  trackUri: `uri-${id}`,
  provider: MusicProvider.ITUNES,
  durationMs: 1000,
});

const item = (id: string, overrides: Partial<FeedShelfItemDto> = {}): FeedShelfItemDto => ({
  reactionId: `reaction-${id}`,
  playlist: { id: `playlist-${id}`, title: `플리 ${id}`, coverImageUrls: [`https://is1-ssl.mzstatic.com/${id}.jpg`], tracksCount: 1 },
  owner: { id: `owner-${id}`, nickname: `주인 ${id}`, profileImgUrl: null },
  musics: [music(`${id}-1`), music(`${id}-2`)],
  ...overrides,
});

const shelf = (key: FeedShelfKey, items: FeedShelfItemDto[], nextCursor?: string): FeedShelfDto => ({ key, items, nextCursor });

const renderFeedView = (queryClient = createTestQueryClient()) => render(<FeedView />, { wrapper: createQueryClientWrapper(queryClient) });

const shelfSection = (title: string) => screen.getByRole('region', { name: title });

describe('FeedView — 출처별 선반', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: false });
    useModalStore.setState({ isOpen: false, modalType: null, modalProps: {} });
  });

  it('서버가 준 순서대로 선반 제목과 카드를 그린다', async () => {
    getFeedShelves.mockResolvedValue({
      shelves: [shelf(FeedShelfKey.TRENDING, [item('t1')]), shelf(FeedShelfKey.RECENT, [item('r1'), item('r2')])],
    });

    renderFeedView();

    const headings = await screen.findAllByRole('heading', { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual(['지금 인기', '새로 올라온']);
    expect(screen.queryByText('팔로우한 사람')).not.toBeInTheDocument();
    expect(
      within(shelfSection('새로 올라온'))
        .getAllByRole('heading', { level: 3 })
        .map((h) => h.textContent),
    ).toEqual(['플리 r1', '플리 r2']);
    expect(within(shelfSection('지금 인기')).getByText('주인 t1')).toBeInTheDocument();
  });

  it('보여 줄 선반이 없으면 빈 상태를 보여 준다', async () => {
    getFeedShelves.mockResolvedValue({ shelves: [] });

    renderFeedView();

    expect(await screen.findByText('아직 공개된 플레이리스트가 없어요.')).toBeInTheDocument();
  });

  it('불러오지 못하면 다시 시도할 수 있다', async () => {
    getFeedShelves.mockRejectedValueOnce(new Error('fail')).mockResolvedValue({ shelves: [shelf(FeedShelfKey.RECENT, [item('r1')])] });

    renderFeedView();

    fireEvent.click(await screen.findByRole('button', { name: '다시 시도' }));
    expect(await screen.findByText('플리 r1')).toBeInTheDocument();
  });

  it('커버를 누르면 반응 기록 id로 상세 모달을 연다', async () => {
    getFeedShelves.mockResolvedValue({ shelves: [shelf(FeedShelfKey.RECENT, [item('r1')])] });

    renderFeedView();
    fireEvent.click(await screen.findByRole('button', { name: '플리 r1 열기' }));

    expect(useModalStore.getState().modalType).toBe(MODAL_TYPES.POST_DETAIL);
    expect(useModalStore.getState().modalProps).toEqual({ postId: 'reaction-r1' });
  });

  it('재생 버튼은 플레이리스트 곡 전체로 전체 재생을 한다', async () => {
    const playAll = jest.fn();
    usePlayerStore.setState({ playAll });
    const target = item('r1');
    getFeedShelves.mockResolvedValue({ shelves: [shelf(FeedShelfKey.RECENT, [target])] });

    renderFeedView();
    fireEvent.click(await screen.findByRole('button', { name: '플리 r1 전체 재생' }));

    expect(playAll).toHaveBeenCalledWith(target.musics);
  });

  it('곡이 없는 플레이리스트에는 재생 버튼이 없다', async () => {
    getFeedShelves.mockResolvedValue({ shelves: [shelf(FeedShelfKey.RECENT, [item('r1', { musics: [] })])] });

    renderFeedView();

    expect(await screen.findByText('플리 r1')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '플리 r1 전체 재생' })).not.toBeInTheDocument();
  });

  it('만든 사람을 누르면 프로필로 간다', async () => {
    getFeedShelves.mockResolvedValue({ shelves: [shelf(FeedShelfKey.RECENT, [item('r1')])] });

    renderFeedView();
    fireEvent.click(await screen.findByRole('button', { name: '주인 r1' }));

    expect(mockPush).toHaveBeenCalledWith('/profile/owner-r1');
  });

  it('선반 끝까지 넘기면 다음 커서부터 이어 불러와 뒤에 붙인다', async () => {
    getFeedShelves.mockResolvedValue({ shelves: [shelf(FeedShelfKey.RECENT, [item('r1')], 'cursor-1')] });
    getFeedShelfPage.mockResolvedValue({ items: [item('r2')], nextCursor: undefined });
    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: true });

    renderFeedView();

    expect(await screen.findByText('플리 r2')).toBeInTheDocument();
    expect(getFeedShelfPage).toHaveBeenCalledTimes(1);
    expect(getFeedShelfPage).toHaveBeenCalledWith(FeedShelfKey.RECENT, 'cursor-1');
    const titles = within(shelfSection('새로 올라온'))
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent);
    expect(titles).toEqual(['플리 r1', '플리 r2']);
  });

  it('다음 커서가 없으면 이어 불러오지 않는다', async () => {
    getFeedShelves.mockResolvedValue({ shelves: [shelf(FeedShelfKey.RECENT, [item('r1')])] });
    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: true });

    renderFeedView();

    expect(await screen.findByText('플리 r1')).toBeInTheDocument();
    expect(getFeedShelfPage).not.toHaveBeenCalled();
  });

  it('이어 불러오기에 실패하면 반복해서 부르지 않고 다시 시도 버튼을 보여 준다', async () => {
    getFeedShelves.mockResolvedValue({ shelves: [shelf(FeedShelfKey.RECENT, [item('r1')], 'cursor-1')] });
    getFeedShelfPage.mockRejectedValueOnce(new Error('fail')).mockResolvedValue({ items: [item('r2')] });
    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: true });

    renderFeedView();

    const retry = await screen.findByRole('button', { name: '다시 시도' });
    expect(getFeedShelfPage).toHaveBeenCalledTimes(1);

    fireEvent.click(retry);
    expect(await screen.findByText('플리 r2')).toBeInTheDocument();
  });

  it('피드 쿼리를 무효화하면 선반을 다시 받아 온다(글쓰기·삭제 후)', async () => {
    getFeedShelves.mockResolvedValueOnce({ shelves: [shelf(FeedShelfKey.RECENT, [item('r1')])] }).mockResolvedValue({
      shelves: [shelf(FeedShelfKey.RECENT, [item('r2')])],
    });
    const queryClient = createTestQueryClient();

    renderFeedView(queryClient);
    expect(await screen.findByText('플리 r1')).toBeInTheDocument();

    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: feedQueryKey });
    });

    expect(await screen.findByText('플리 r2')).toBeInTheDocument();
    expect(screen.queryByText('플리 r1')).not.toBeInTheDocument();
  });
});
