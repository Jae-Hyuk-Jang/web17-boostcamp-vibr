import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { PostResponseDto as Post } from '@repo/dto';

import PostHeader from './PostHeader';
import { feedQueryKey, type FeedPage } from '@/components/feed/FeedView';
import { createTestQueryClient, createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/components/ui/ConfirmToast', () => ({
  showConfirmToast: (_message: string, onConfirm: () => void) => onConfirm(),
}));

jest.mock('@/api', () => ({
  deletePost: jest.fn(),
}));

const { deletePost } = jest.requireMock('@/api') as { deletePost: jest.Mock };

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

const seedFeedCache = (queryClient: ReturnType<typeof createTestQueryClient>, posts: Post[]) => {
  const page: FeedPage = { posts, hasNext: false, nextCursor: undefined };
  queryClient.setQueryData(feedQueryKey, { pages: [page], pageParams: [undefined] });
};

describe('PostHeader — 삭제 동기화 특성화(#166)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('삭제 성공 시 deletePost를 호출하고 feedQueryKey 캐시에서 해당 게시글을 제거한다', async () => {
    deletePost.mockResolvedValue(undefined);
    const post = mockPost();
    const other = mockPost({ id: 'post-2' });
    const onDeletePost = jest.fn();
    const queryClient = createTestQueryClient();
    seedFeedCache(queryClient, [post, other]);

    render(<PostHeader post={post} isOwner onUserClick={jest.fn()} onDeletePost={onDeletePost} />, {
      wrapper: createQueryClientWrapper(queryClient),
    });

    fireEvent.click(screen.getByTitle('더보기'));
    fireEvent.click(screen.getByText('삭제하기'));

    await waitFor(() => expect(deletePost).toHaveBeenCalledWith('post-1'));
    await waitFor(() => {
      const cached = queryClient.getQueryData<{ pages: FeedPage[] }>(feedQueryKey);
      expect(cached?.pages[0]?.posts.map((p) => p.id)).toEqual(['post-2']);
    });
    expect(onDeletePost).toHaveBeenCalled();
  });

  it('삭제 실패 시 캐시를 그대로 유지한다', async () => {
    deletePost.mockRejectedValue(new Error('fail'));
    const post = mockPost();
    const onDeletePost = jest.fn();
    const queryClient = createTestQueryClient();
    seedFeedCache(queryClient, [post]);

    render(<PostHeader post={post} isOwner onUserClick={jest.fn()} onDeletePost={onDeletePost} />, {
      wrapper: createQueryClientWrapper(queryClient),
    });

    fireEvent.click(screen.getByTitle('더보기'));
    fireEvent.click(screen.getByText('삭제하기'));

    await waitFor(() => expect(deletePost).toHaveBeenCalledWith('post-1'));
    const cached = queryClient.getQueryData<{ pages: FeedPage[] }>(feedQueryKey);
    expect(cached?.pages[0]?.posts.map((p) => p.id)).toEqual(['post-1']);
    expect(onDeletePost).not.toHaveBeenCalled();
  });

  it('isOwner가 false면 더보기 메뉴 버튼이 렌더링되지 않는다', () => {
    const post = mockPost();
    render(<PostHeader post={post} isOwner={false} onUserClick={jest.fn()} />, { wrapper: createQueryClientWrapper() });

    expect(screen.queryByTitle('더보기')).not.toBeInTheDocument();
  });
});
