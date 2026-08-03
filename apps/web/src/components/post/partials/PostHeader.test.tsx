import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { PostResponseDto as Post } from '@repo/dto';

import PostHeader from './PostHeader';
import { usePostReactionOverridesStore } from '@/stores/usePostReactionOverridesStore';

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

describe('PostHeader — 삭제 동기화 특성화(#153)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePostReactionOverridesStore.setState({ likesByPostId: {}, commentsByPostId: {}, contentByPostId: {}, deletedPostId: null });
  });

  it('삭제 성공 시 deletePost를 호출하고 usePostReactionOverridesStore.deletedPostId를 postId로 설정한다', async () => {
    deletePost.mockResolvedValue(undefined);
    const post = mockPost();
    const onDeletePost = jest.fn();

    render(<PostHeader post={post} isOwner onUserClick={jest.fn()} onDeletePost={onDeletePost} />);

    fireEvent.click(screen.getByTitle('더보기'));
    fireEvent.click(screen.getByText('삭제하기'));

    await waitFor(() => expect(deletePost).toHaveBeenCalledWith('post-1'));
    await waitFor(() => expect(usePostReactionOverridesStore.getState().deletedPostId).toBe('post-1'));
    expect(onDeletePost).toHaveBeenCalled();
  });

  it('삭제 실패 시 deletedPostId를 설정하지 않는다', async () => {
    deletePost.mockRejectedValue(new Error('fail'));
    const post = mockPost();
    const onDeletePost = jest.fn();

    render(<PostHeader post={post} isOwner onUserClick={jest.fn()} onDeletePost={onDeletePost} />);

    fireEvent.click(screen.getByTitle('더보기'));
    fireEvent.click(screen.getByText('삭제하기'));

    await waitFor(() => expect(deletePost).toHaveBeenCalledWith('post-1'));
    expect(usePostReactionOverridesStore.getState().deletedPostId).toBeNull();
    expect(onDeletePost).not.toHaveBeenCalled();
  });

  it('isOwner가 false면 더보기 메뉴 버튼이 렌더링되지 않는다', () => {
    const post = mockPost();
    render(<PostHeader post={post} isOwner={false} onUserClick={jest.fn()} />);

    expect(screen.queryByTitle('더보기')).not.toBeInTheDocument();
  });
});
