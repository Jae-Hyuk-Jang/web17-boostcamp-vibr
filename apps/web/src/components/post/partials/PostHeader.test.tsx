import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { PostResponseDto as Post } from '@repo/dto';

import PostHeader from './PostHeader';
import { feedQueryKey } from '@/query-keys';
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
  playlist: { id: 'playlist-test', title: '테스트 플레이리스트', coverImageUrls: [], tracksCount: 0 },
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

describe('PostHeader — 삭제 동기화', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('삭제 성공 시 deletePost를 호출하고 피드 쿼리를 무효화해 선반을 다시 받아 온다', async () => {
    deletePost.mockResolvedValue(undefined);
    const post = mockPost();
    const onDeletePost = jest.fn();
    const queryClient = createTestQueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    render(<PostHeader post={post} isOwner onUserClick={jest.fn()} onDeletePost={onDeletePost} />, {
      wrapper: createQueryClientWrapper(queryClient),
    });

    fireEvent.click(screen.getByTitle('더보기'));
    fireEvent.click(screen.getByText('삭제하기'));

    await waitFor(() => expect(deletePost).toHaveBeenCalledWith('post-1'));
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: feedQueryKey }));
    expect(onDeletePost).toHaveBeenCalled();
  });

  it('삭제 실패 시 피드를 다시 받아 오지 않는다', async () => {
    deletePost.mockRejectedValue(new Error('fail'));
    const post = mockPost();
    const onDeletePost = jest.fn();
    const queryClient = createTestQueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    render(<PostHeader post={post} isOwner onUserClick={jest.fn()} onDeletePost={onDeletePost} />, {
      wrapper: createQueryClientWrapper(queryClient),
    });

    fireEvent.click(screen.getByTitle('더보기'));
    fireEvent.click(screen.getByText('삭제하기'));

    await waitFor(() => expect(deletePost).toHaveBeenCalledWith('post-1'));
    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(onDeletePost).not.toHaveBeenCalled();
  });

  it('isOwner가 false면 더보기 메뉴 버튼이 렌더링되지 않는다', () => {
    const post = mockPost();
    render(<PostHeader post={post} isOwner={false} onUserClick={jest.fn()} />, { wrapper: createQueryClientWrapper() });

    expect(screen.queryByTitle('더보기')).not.toBeInTheDocument();
  });
});
