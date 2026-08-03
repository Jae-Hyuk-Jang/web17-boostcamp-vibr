import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { useInView } from 'react-intersection-observer';
import type { PostResponseDto as Post, Cursor } from '@repo/dto';

import FeedView from './FeedView';
import { useFeedRefreshStore, usePostDeletionSignalStore, useModalStore } from '@/stores';
import { createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';

jest.mock('react-intersection-observer', () => ({
  useInView: jest.fn(),
}));

const mockUseInView = useInView as jest.Mock;

jest.mock('@/api', () => ({
  getFeedPosts: jest.fn(),
}));

jest.mock('./FeedList', () => ({
  __esModule: true,
  default: ({ posts }: { posts: Post[] }) => (
    <ul data-testid="feed-list">
      {posts.map((p) => (
        <li key={p.id}>{p.id}</li>
      ))}
    </ul>
  ),
}));

const { getFeedPosts } = jest.requireMock('@/api') as { getFeedPosts: jest.Mock };

const mockPost = (overrides: Partial<Post> = {}): Post => ({
  id: 'post-1',
  author: { id: 'author-1', nickname: 'author', profileImgUrl: null },
  coverImgUrl: '',
  musics: [],
  content: 'content',
  likeCount: 0,
  commentCount: 0,
  createdAt: new Date().toISOString(),
  isEdited: false,
  isLiked: false,
  ...overrides,
});

const renderFeedView = (props: { initialPost?: Post } = {}) => render(<FeedView {...props} />, { wrapper: createQueryClientWrapper() });

describe('FeedView — 무한스크롤/리프레시/삭제 반영 특성화(#166)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: false });
    useFeedRefreshStore.setState({ nonce: 0 });
    usePostDeletionSignalStore.setState({ deletedPostId: null });
    useModalStore.setState({ isOpen: false, modalType: null, modalProps: {} });
  });

  it('초기 로드 시 getFeedPosts 결과를 items/hasNext/nextCursor 형태로 받아 목록을 렌더링한다', async () => {
    const postA = mockPost({ id: 'a' });
    getFeedPosts.mockResolvedValue({ posts: [postA], hasNext: false, nextCursor: undefined });

    renderFeedView();

    await waitFor(() => expect(screen.getByTestId('feed-list')).toHaveTextContent('a'));
    expect(getFeedPosts).toHaveBeenCalledWith(undefined, undefined);
  });

  it('다음 페이지 로드 시 이전 nextCursor(다중 소스 커서)를 그대로 넘기고, 중복 postId는 dedupe한다', async () => {
    const postA = mockPost({ id: 'a' });
    const postADuplicate = mockPost({ id: 'a', content: 'updated' });
    const postB = mockPost({ id: 'b' });
    const cursor1: Cursor = { following: 'f1', trending: 't1', recent: 'r1' };

    getFeedPosts
      .mockResolvedValueOnce({ posts: [postA], hasNext: true, nextCursor: cursor1 })
      .mockResolvedValueOnce({ posts: [postADuplicate, postB], hasNext: false, nextCursor: undefined });

    const { rerender } = renderFeedView();
    await waitFor(() => expect(screen.getByTestId('feed-list')).toHaveTextContent('a'));

    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: true });
    rerender(<FeedView />);

    await waitFor(() => expect(getFeedPosts).toHaveBeenCalledTimes(2), { timeout: 2000 });
    expect(getFeedPosts).toHaveBeenNthCalledWith(2, cursor1, undefined);
    await waitFor(() => expect(screen.getByTestId('feed-list')).toHaveTextContent('b'));
  });

  it('에러 발생 시 에러 메시지를 표시한다', async () => {
    getFeedPosts.mockRejectedValue(new Error('network error'));

    renderFeedView();

    await waitFor(() => expect(screen.getByText('오류가 발생했습니다.')).toBeInTheDocument());
  });

  it('useFeedRefreshStore.bump() 후(nonce 변경) 피드를 재조회한다', async () => {
    const postA = mockPost({ id: 'a' });
    const postX = mockPost({ id: 'x' });
    getFeedPosts.mockResolvedValueOnce({ posts: [postA], hasNext: false, nextCursor: undefined });

    renderFeedView();
    await waitFor(() => expect(screen.getByTestId('feed-list')).toHaveTextContent('a'));

    getFeedPosts.mockResolvedValueOnce({ posts: [postX], hasNext: false, nextCursor: undefined });
    act(() => {
      useFeedRefreshStore.getState().bump();
    });

    await waitFor(() => expect(screen.getByTestId('feed-list')).toHaveTextContent('x'), { timeout: 2000 });
    expect(getFeedPosts).toHaveBeenCalledTimes(2);
  });

  it('usePostDeletionSignalStore에 deletedPostId가 설정되면 피드에서 해당 게시글이 사라진다', async () => {
    const postA = mockPost({ id: 'a' });
    const postB = mockPost({ id: 'b' });
    getFeedPosts.mockResolvedValue({ posts: [postA, postB], hasNext: false, nextCursor: undefined });

    renderFeedView();
    await waitFor(() => expect(screen.getByTestId('feed-list')).toHaveTextContent('a'));
    expect(screen.getByTestId('feed-list')).toHaveTextContent('b');

    act(() => {
      usePostDeletionSignalStore.getState().setDeletedPostId('a');
    });

    await waitFor(() => expect(screen.getByTestId('feed-list')).not.toHaveTextContent('a'));
    expect(screen.getByTestId('feed-list')).toHaveTextContent('b');
    expect(usePostDeletionSignalStore.getState().deletedPostId).toBeNull();
  });

  it('initialPost가 있으면 목록 맨 앞에 시딩되고, 게시글 상세 모달이 자동으로 열린다', async () => {
    const initialPost = mockPost({ id: 'shared-post' });
    getFeedPosts.mockResolvedValue({ posts: [], hasNext: false, nextCursor: undefined });

    renderFeedView({ initialPost });

    expect(screen.getByTestId('feed-list')).toHaveTextContent('shared-post');
    expect(useModalStore.getState().isOpen).toBe(true);
    expect(useModalStore.getState().modalProps).toMatchObject({ postId: 'shared-post' });
  });
});
