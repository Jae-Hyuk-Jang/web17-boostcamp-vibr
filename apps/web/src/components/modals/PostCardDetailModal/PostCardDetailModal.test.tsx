import { render, screen, fireEvent, act } from '@testing-library/react';
import type { PostResponseDto as Post, MusicResponseDto as Music } from '@repo/dto';

import { PostCardDetailModal } from './PostCardDetailModal';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePostReactionOverridesStore } from '@/stores/usePostReactionOverridesStore';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/',
}));

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/api', () => ({
  updatePost: jest.fn(),
}));

jest.mock('@/utils/logQueue', () => ({
  enqueueLog: jest.fn(),
}));

jest.mock('@/hooks/useIsMobile', () => ({
  __esModule: true,
  default: () => false,
}));

// PostCardDetailModal.tsx는 이 훅들을 '@/hooks' 루트 배럴에서 가져온다.
// usePostDetailUxLog는 실제 구현을 그대로 쓴다 — 이 파일의 관찰 지점(enqueueLog)이
// 컴포넌트가 아니라 그 훅 내부에 있으므로, 훅까지 mock하면 특성화 테스트의 의미가 사라진다.
jest.mock('@/hooks', () => {
  const actual = jest.requireActual('@/hooks');
  return {
    ...actual,
    useScrollLock: () => {},
    usePostDetail: jest.fn(),
    useLikedUsers: () => ({ users: [], isLoading: false, errorMsg: null, refetch: jest.fn() }),
    usePostReactions: jest.fn(),
    useSwipeToDismiss: (onClose: () => void) => ({
      sheetRef: { current: null },
      handleTouchStart: jest.fn(),
      handleTouchMove: jest.fn(),
      handleTouchEnd: jest.fn(),
      __onClose: onClose, // 테스트에서 직접 쓰진 않지만 실제 훅과 동일한 인자를 받는지 형태만 맞춤
    }),
  };
});

jest.mock('./partials', () => ({
  PostDetailBody: () => <div data-testid="post-detail-body" />,
  PostDetailActions: () => <div data-testid="post-detail-actions" />,
  PostDetailCommentComposer: () => <div data-testid="post-detail-comment-composer" />,
  LikedUsersOverlay: () => <div data-testid="liked-users-overlay" />,
}));

// ModalShell은 실제 구현을 그대로 쓴다(#70) — 데스크탑 backdrop의 role="dialog"/닫기 판정이
// 이제 ModalShell 내부에 있으므로, 통째로 mock하면 이 파일의 특성화 테스트가 무의미해진다.
// '@/components' 배럴 전체를 requireActual하면 player 등 무관한 하위 트리까지 평가되며
// 순환 참조 오류가 나므로, ModalShell 파일만 개별적으로 requireActual한다.
jest.mock('@/components', () => {
  const { default: ModalShell } = jest.requireActual('@/components/ModalShell');
  return {
    ModalShell,
    LoadingSpinner: () => <div data-testid="loading-spinner" />,
    PostMedia: ({ onPlay, post }: { onPlay: (m: Music) => void; post: Post }) => (
      <button data-testid="play-first-music" onClick={() => post.musics[0] && onPlay(post.musics[0])}>
        play
      </button>
    ),
  };
});

jest.mock('../../post', () => ({
  PostHeader: () => <div data-testid="post-header" />,
}));

const { usePostDetail, usePostReactions } = jest.requireMock('@/hooks') as {
  usePostDetail: jest.Mock;
  usePostReactions: jest.Mock;
};
const { enqueueLog } = jest.requireMock('@/utils/logQueue') as { enqueueLog: jest.Mock };

const mockMusic = (overrides: Partial<Music> = {}): Music => ({
  id: 'music-1',
  trackUri: 'uri-1',
  provider: 'SPOTIFY' as Music['provider'],
  albumCoverUrl: 'https://example.com/cover.jpg',
  title: 'Song',
  artistName: 'Artist',
  durationMs: 180000,
  ...overrides,
});

const mockPost = (overrides: Partial<Post> = {}): Post => ({
  id: 'post-1',
  author: { id: 'author-1', nickname: 'author', profileImgUrl: null },
  coverImgUrl: '',
  musics: [mockMusic()],
  content: 'content',
  likeCount: 0,
  commentCount: 0,
  createdAt: new Date().toISOString(),
  isEdited: false,
  isLiked: false,
  ...overrides,
});

const defaultReactions = {
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
};

const openModalFor = (post: Post) => {
  useModalStore.getState().openModal(MODAL_TYPES.POST_DETAIL, { postId: post.id });
};

describe('PostCardDetailModal — UX 로그 특성화 테스트 (#56)', () => {
  beforeEach(() => {
    useModalStore.setState({ isOpen: false, modalType: null, modalProps: {} });
    usePlayerStore.setState({ currentMusic: null, isPlaying: false });
    usePostReactionOverridesStore.setState({ likesByPostId: {}, commentsByPostId: {}, contentByPostId: {}, deletedPostId: null });
    useAuthStore.setState({ userId: 'me', isAuthenticated: true, isLoading: false });

    usePostDetail.mockReturnValue({ post: mockPost(), isLoading: false, error: null, updatePostContent: jest.fn() });
    usePostReactions.mockReturnValue({ ...defaultReactions });
    enqueueLog.mockClear();
  });

  it('로그인 사용자가 닫기 버튼으로 모달을 닫으면 enqueueLog가 dwell 정보와 함께 1회 호출된다', () => {
    const post = mockPost();
    usePostDetail.mockReturnValue({ post, isLoading: false, error: null, updatePostContent: jest.fn() });
    openModalFor(post);

    render(<PostCardDetailModal />);

    // 데스크톱 배경 클릭으로 닫기(ModalShell backdrop, onMouseDown 기반 판정 — #70)
    fireEvent.mouseDown(screen.getByRole('dialog'));

    expect(enqueueLog).toHaveBeenCalledTimes(1);
    const event = enqueueLog.mock.calls[0][0];
    expect(event.targetPostId).toBe('post-1');
    expect(event.meta.playedMusicCount).toBe(0);
  });

  it('모달이 닫기 버튼 없이 unmount되면 enqueueLog가 1회 호출된다', () => {
    const post = mockPost();
    usePostDetail.mockReturnValue({ post, isLoading: false, error: null, updatePostContent: jest.fn() });
    openModalFor(post);

    const { unmount } = render(<PostCardDetailModal />);
    unmount();

    expect(enqueueLog).toHaveBeenCalledTimes(1);
  });

  it('닫기 버튼 클릭 직후 unmount되어도 enqueueLog는 정확히 1회만 호출된다(중복 없음)', () => {
    const post = mockPost();
    usePostDetail.mockReturnValue({ post, isLoading: false, error: null, updatePostContent: jest.fn() });
    openModalFor(post);

    const { unmount } = render(<PostCardDetailModal />);
    fireEvent.mouseDown(screen.getByRole('dialog'));
    unmount();

    expect(enqueueLog).toHaveBeenCalledTimes(1);
  });

  it('비로그인 사용자는 모달을 닫아도 enqueueLog가 호출되지 않는다', () => {
    useAuthStore.setState({ userId: null, isAuthenticated: false, isLoading: false });
    const post = mockPost();
    usePostDetail.mockReturnValue({ post, isLoading: false, error: null, updatePostContent: jest.fn() });
    openModalFor(post);

    const { unmount } = render(<PostCardDetailModal />);
    unmount();

    expect(enqueueLog).not.toHaveBeenCalled();
  });

  it('이 게시글의 음악을 재생 중이면 재생 시간이 listenMsByMusic에 누적된다', async () => {
    const music = mockMusic({ id: 'music-1' });
    const post = mockPost({ musics: [music] });
    usePostDetail.mockReturnValue({ post, isLoading: false, error: null, updatePostContent: jest.fn() });
    openModalFor(post);

    const { unmount } = render(<PostCardDetailModal />);

    act(() => {
      usePlayerStore.setState({ currentMusic: music, isPlaying: true });
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1100));
    });

    unmount();

    expect(enqueueLog).toHaveBeenCalledTimes(1);
    const event = enqueueLog.mock.calls[0][0];
    expect(event.meta.listenMsByMusic['music-1']).toBeGreaterThan(0);
  });

  it('다른 게시글의 음악을 재생 중이면 이 게시글의 listenMsByMusic에는 누적되지 않는다', async () => {
    const thisPostMusic = mockMusic({ id: 'music-1' });
    const otherMusic = mockMusic({ id: 'other-music' });
    const post = mockPost({ musics: [thisPostMusic] });
    usePostDetail.mockReturnValue({ post, isLoading: false, error: null, updatePostContent: jest.fn() });
    openModalFor(post);

    const { unmount } = render(<PostCardDetailModal />);

    act(() => {
      usePlayerStore.setState({ currentMusic: otherMusic, isPlaying: true });
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1100));
    });

    unmount();

    expect(enqueueLog).toHaveBeenCalledTimes(1);
    const event = enqueueLog.mock.calls[0][0];
    expect(event.meta.listenMsByMusic['other-music']).toBeUndefined();
    expect(event.meta.listenMsByMusic['music-1']).toBeUndefined();
  });

  it('모바일(바텀시트) 배경을 클릭해도 enqueueLog가 1회 호출된다 (#66)', () => {
    const post = mockPost();
    usePostDetail.mockReturnValue({ post, isLoading: false, error: null, updatePostContent: jest.fn() });
    openModalFor(post);

    const { container } = render(<PostCardDetailModal />);

    // 모바일 바텀시트 backdrop(lg:hidden 래퍼의 첫 자식, onClick={handleClose})
    const mobileWrapper = container.firstElementChild as HTMLElement;
    const mobileBackdrop = mobileWrapper.firstElementChild as HTMLElement;
    fireEvent.click(mobileBackdrop);

    expect(enqueueLog).toHaveBeenCalledTimes(1);
  });

  it('모달에서 곡을 재생하면 playedMusicCount에 반영된다', () => {
    const music = mockMusic({ id: 'music-1' });
    const post = mockPost({ musics: [music] });
    usePostDetail.mockReturnValue({ post, isLoading: false, error: null, updatePostContent: jest.fn() });
    openModalFor(post);

    const { unmount } = render(<PostCardDetailModal />);

    fireEvent.click(screen.getByTestId('play-first-music'));
    unmount();

    expect(enqueueLog).toHaveBeenCalledTimes(1);
    const event = enqueueLog.mock.calls[0][0];
    expect(event.meta.playedMusicCount).toBe(1);
  });
});
