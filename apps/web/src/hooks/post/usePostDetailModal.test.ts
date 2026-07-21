import { renderHook, act, waitFor } from '@testing-library/react';
import type { PostResponseDto as Post } from '@repo/dto';

import { usePostDetailModal } from './usePostDetailModal';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { usePostReactionOverridesStore } from '@/stores/usePostReactionOverridesStore';
import { useAuthStore } from '@/stores/useAuthStore';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/',
}));

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/api', () => ({
  updatePost: jest.fn(),
}));

jest.mock('@/hooks/useIsMobile', () => ({
  __esModule: true,
  default: () => false,
}));

jest.mock('@/hooks', () => {
  const actual = jest.requireActual('@/hooks');
  return {
    ...actual,
    usePostDetail: jest.fn(),
    useLikedUsers: jest.fn(),
    usePostReactions: jest.fn(),
  };
});

const { usePostDetail, useLikedUsers, usePostReactions } = jest.requireMock('@/hooks') as {
  usePostDetail: jest.Mock;
  useLikedUsers: jest.Mock;
  usePostReactions: jest.Mock;
};
const { updatePost } = jest.requireMock('@/api') as { updatePost: jest.Mock };

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
  isLiked: true,
  ...overrides,
});

const openModalFor = (post: Post, extraProps: Record<string, unknown> = {}) => {
  useModalStore.getState().openModal(MODAL_TYPES.POST_DETAIL, { postId: post.id, ...extraProps });
};

describe('usePostDetailModal', () => {
  beforeEach(() => {
    useModalStore.setState({ isOpen: false, modalType: null, modalProps: {} });
    usePostReactionOverridesStore.setState({ likesByPostId: {}, commentsByPostId: {}, contentByPostId: {}, deletedPostId: null });
    useAuthStore.setState({ userId: 'me', isAuthenticated: true, isLoading: false });

    usePostDetail.mockReturnValue({ post: mockPost(), isLoading: false, error: null, updatePostContent: jest.fn() });
    useLikedUsers.mockReturnValue({ users: [], isLoading: false, errorMsg: null, refetch: jest.fn() });
    usePostReactions.mockReturnValue({
      isAuthenticated: true,
      isLiked: false,
      likeCount: 0,
      toggleLike: jest.fn(),
      isSubmittingLike: false,
      comments: [],
      isCommentsLoading: false,
      commentText: '',
      setCommentText: jest.fn(),
      submitComment: jest.fn(),
      isSubmittingComment: false,
      commentCount: 0,
      refetchComments: jest.fn(),
    });
    updatePost.mockReset();
    mockPush.mockClear();
  });

  it('usePostReactions에 오버라이드 > post > passedPost 순으로 우선한 초기 좋아요 상태를 넘긴다', () => {
    const post = mockPost({ isLiked: true, likeCount: 5 });
    usePostDetail.mockReturnValue({ post, isLoading: false, error: null, updatePostContent: jest.fn() });
    usePostReactionOverridesStore.setState({
      likesByPostId: { 'post-1': { isLiked: false, likeCount: 1 } },
      commentsByPostId: {},
      contentByPostId: {},
      deletedPostId: null,
    });
    openModalFor(post);

    renderHook(() => usePostDetailModal());

    expect(usePostReactions).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true, postId: 'post-1', initialIsLiked: false, initialLikeCount: 1 }),
    );
  });

  it('좋아요한 사용자 목록을 열면 useLikedUsers가 enabled: true로 재호출된다', () => {
    const post = mockPost();
    usePostDetail.mockReturnValue({ post, isLoading: false, error: null, updatePostContent: jest.fn() });
    openModalFor(post);

    const { result, rerender } = renderHook(() => usePostDetailModal());

    expect(useLikedUsers).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false, postId: 'post-1' }));

    act(() => {
      result.current.likedUsers.open();
    });
    rerender();

    expect(useLikedUsers).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: true, postId: 'post-1' }));
  });

  it('modalProps.initialIsEditing이 true면 editing이 초기 렌더부터 편집 모드로 시작한다', () => {
    const post = mockPost({ content: 'original' });
    usePostDetail.mockReturnValue({ post, isLoading: false, error: null, updatePostContent: jest.fn() });
    openModalFor(post, { initialIsEditing: true, initialEditingContent: 'draft from feed' });

    const { result } = renderHook(() => usePostDetailModal());

    expect(result.current.editing.isEditing).toBe(true);
    expect(result.current.editing.draft).toBe('draft from feed');
  });

  it('editing.commit 성공 시 updatePost·updatePostContent·setContentOverride가 모두 호출된다', async () => {
    const post = mockPost({ content: 'original' });
    const updatePostContent = jest.fn();
    usePostDetail.mockReturnValue({ post, isLoading: false, error: null, updatePostContent });
    updatePost.mockResolvedValue(undefined);
    openModalFor(post);

    const { result } = renderHook(() => usePostDetailModal());

    act(() => {
      result.current.editing.startEdit('original');
    });
    act(() => {
      result.current.editing.setDraft('updated');
    });
    await act(async () => {
      await result.current.editing.commit();
    });

    expect(updatePost).toHaveBeenCalledWith('post-1', { content: 'updated' });
    expect(updatePostContent).toHaveBeenCalledWith('updated');
    expect(usePostReactionOverridesStore.getState().contentByPostId['post-1']).toEqual({ content: 'updated' });
  });

  it('handleClose는 모달을 닫는다', () => {
    const post = mockPost();
    usePostDetail.mockReturnValue({ post, isLoading: false, error: null, updatePostContent: jest.fn() });
    openModalFor(post);

    const { result } = renderHook(() => usePostDetailModal());

    act(() => {
      result.current.handleClose();
    });

    expect(useModalStore.getState().isOpen).toBe(false);
  });

  it('handleUserClick은 해당 사용자 프로필로 이동한다', () => {
    const post = mockPost();
    usePostDetail.mockReturnValue({ post, isLoading: false, error: null, updatePostContent: jest.fn() });
    openModalFor(post);

    const { result } = renderHook(() => usePostDetailModal());

    act(() => {
      result.current.handleUserClick('other-user');
    });

    expect(mockPush).toHaveBeenCalledWith('/profile/other-user');
  });

  it('postId가 없으면 모달을 자동으로 닫는다', async () => {
    useModalStore.getState().openModal(MODAL_TYPES.POST_DETAIL, {});

    renderHook(() => usePostDetailModal());

    await waitFor(() => {
      expect(useModalStore.getState().isOpen).toBe(false);
    });
  });
});
