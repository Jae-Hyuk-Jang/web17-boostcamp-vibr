import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { PostResponseDto as Post } from '@repo/dto';

import PostCard from './PostCard';
import { usePostReactionOverridesStore } from '@/stores/usePostReactionOverridesStore';
import { useAuthStore } from '@/stores/useAuthStore';

jest.mock('./index', () => ({
  PostHeader: () => <div data-testid="post-header" />,
  PostMedia: () => <div data-testid="post-media" />,
  PostActions: ({ post, onClickLike, disabledLike }: { post: Post; onClickLike: () => void; disabledLike: boolean }) => (
    <button data-testid="like-button" onClick={onClickLike} disabled={disabledLike}>
      like:{String(post.isLiked)}:{post.likeCount}:comments:{post.commentCount}
    </button>
  ),
  PostContentPreview: () => <div data-testid="post-content-preview" />,
}));

jest.mock('@/api', () => ({
  addLike: jest.fn(),
  removeLike: jest.fn(),
}));

const { addLike, removeLike } = jest.requireMock('@/api') as { addLike: jest.Mock; removeLike: jest.Mock };

const mockPost = (overrides: Partial<Post> = {}): Post => ({
  id: 'post-1',
  author: { id: 'author-1', nickname: 'author', profileImgUrl: null },
  coverImgUrl: '',
  musics: [],
  content: 'content',
  likeCount: 3,
  commentCount: 0,
  createdAt: new Date().toISOString(),
  isEdited: false,
  isLiked: false,
  ...overrides,
});

const renderPostCard = (post: Post) =>
  render(<PostCard post={post} currentMusicId={null} isPlayingGlobal={false} onPlay={jest.fn()} onUserClick={jest.fn()} onOpenDetail={jest.fn()} />);

describe('PostCard — 게시글 반응 상태 특성화 테스트', () => {
  beforeEach(() => {
    usePostReactionOverridesStore.setState({ likesByPostId: {}, commentsByPostId: {}, contentByPostId: {}, deletedPostId: null });
    useAuthStore.setState({ userId: 'me', isAuthenticated: true, isLoading: false });
    jest.clearAllMocks();
  });

  it('로그인 사용자가 좋아요를 누르면 즉시 낙관적으로 반영되고, 성공 시 전역 override에 기록된다', async () => {
    addLike.mockResolvedValue({});

    renderPostCard(mockPost({ isLiked: false, likeCount: 3 }));

    const button = screen.getByTestId('like-button');
    expect(button).toHaveTextContent('like:false:3');

    fireEvent.click(button);

    // optimistic — API 응답을 기다리지 않고 즉시 반영
    expect(button).toHaveTextContent('like:true:4');

    await waitFor(() => expect(addLike).toHaveBeenCalledWith({ postId: 'post-1' }));
    expect(usePostReactionOverridesStore.getState().likesByPostId['post-1']).toEqual({ isLiked: true, likeCount: 4 });
  });

  it('좋아요 요청이 실패하면 로컬 상태와 전역 override 모두 이전 값으로 롤백된다', async () => {
    removeLike.mockRejectedValue(new Error('network error'));

    renderPostCard(mockPost({ isLiked: true, likeCount: 5 }));

    const button = screen.getByTestId('like-button');
    fireEvent.click(button);
    expect(button).toHaveTextContent('like:false:4');

    await waitFor(() => expect(removeLike).toHaveBeenCalledWith('post-1'));
    await waitFor(() => expect(button).toHaveTextContent('like:true:5'));
    expect(usePostReactionOverridesStore.getState().likesByPostId['post-1']).toEqual({ isLiked: true, likeCount: 5 });
  });

  it('비로그인 사용자는 좋아요 버튼이 비활성화되고, 클릭해도 API가 호출되지 않는다', () => {
    useAuthStore.setState({ userId: null, isAuthenticated: false, isLoading: false });

    renderPostCard(mockPost({ isLiked: false, likeCount: 3 }));

    const button = screen.getByTestId('like-button');
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(addLike).not.toHaveBeenCalled();
    expect(button).toHaveTextContent('like:false:3');
  });

  it('[카드 ↔ 모달 동기화] 다른 화면(상세 모달)이 먼저 좋아요 override를 남겨두면, 카드는 마운트 즉시 그 값을 반영한다', () => {
    // usePostReactions.toggleLike이 하는 것과 동일한 store 쓰기를 직접 시뮬레이션 —
    // "상세 모달에서 이미 좋아요를 눌러놓은 상태로 피드에 진입"하는 시나리오
    usePostReactionOverridesStore.getState().setLikeOverride('post-1', { isLiked: true, likeCount: 4 });

    // 카드가 들고 있는 건 override 반영 전의 "구" 서버 값
    renderPostCard(mockPost({ isLiked: false, likeCount: 3 }));

    expect(screen.getByTestId('like-button')).toHaveTextContent('like:true:4');
  });

  it('[댓글 수 동기화] 상세 모달에서의 댓글 작성으로 남은 commentsByPostId override를 카드가 반영한다', () => {
    usePostReactionOverridesStore.getState().setCommentOverride('post-1', { commentCount: 7 });

    renderPostCard(mockPost({ commentCount: 2 }));

    expect(screen.getByTestId('like-button')).toHaveTextContent('comments:7');
  });
});
