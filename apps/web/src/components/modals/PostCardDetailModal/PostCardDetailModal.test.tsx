import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import type { PostResponseDto as Post, MusicResponseDto as Music } from '@repo/dto';

import { PostCardDetailModal } from './PostCardDetailModal';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { seedAuthMe } from '@/test-utils/authMeTestUtils';
import { createTestQueryClient, createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';

const mockPush = jest.fn();
const mockUsePathname = jest.fn(() => '/');
const mockUseIsMobile = jest.fn(() => false);

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockUsePathname(),
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
  default: () => mockUseIsMobile(),
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

// PostCardDetailModalMobileSheet/PostCardDetailModalDesktopShell는 실제 구현을 그대로 써서
// props 배선(usePostDetailModal → 두 서브컴포넌트)까지 특성화한다. 그 안에서 쓰는 leaf
// partials만 개별 파일 단위로 mock한다 — 배럴(./partials)을 통째로 mock하면 두 서브컴포넌트
// 자체가 가짜가 되어 이 이슈(#130)가 만든 배선을 검증할 수 없다.
jest.mock('./partials/PostDetailBody', () => ({
  __esModule: true,
  default: () => <div data-testid="post-detail-body" />,
}));

jest.mock('./partials/PostDetailActions', () => ({
  __esModule: true,
  default: ({ onOpenLikedUsers }: { onOpenLikedUsers: () => void }) => (
    <button type="button" onClick={onOpenLikedUsers}>
      open-liked-users
    </button>
  ),
}));

jest.mock('./partials/PostDetailCommentComposer', () => ({
  __esModule: true,
  default: () => <div data-testid="post-detail-comment-composer" />,
}));

jest.mock('./partials/PostDetailEditForm', () => ({
  __esModule: true,
  default: ({
    value,
    isSaving,
    onChange,
    onSave,
    onCancel,
  }: {
    value: string;
    isSaving: boolean;
    onChange: (next: string) => void;
    onSave: () => void;
    onCancel: () => void;
  }) => (
    <div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} />
      <button type="button" onClick={onCancel}>
        취소
      </button>
      <button type="button" onClick={onSave} disabled={isSaving}>
        {isSaving ? '저장 중...' : '저장'}
      </button>
    </div>
  ),
}));

jest.mock('./partials/LikedUsersOverlay', () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="liked-users-overlay-open" /> : null),
}));

// ModalShell/LoadingSpinner는 PostCardDetailModal.tsx가 '@/components/ModalShell',
// '@/components/LoadingSpinner' 개별 경로에서 직접 import하므로 mock하지 않고 실제 구현을 쓴다
// (ModalShell은 #70의 데스크탑 backdrop role="dialog"/닫기 판정을 그대로 검증하기 위함).
//
// PostMedia는 '@/components/post'에서 import하는데, 이는 아래 '../../post' mock과 동일한
// 실제 모듈(src/components/post/index.ts)로 resolve된다 — 그래서 PostHeader와 함께 이 mock
// 하나에 정의해야 한다. 따로 mock하면 이 파일 mock이 덮어써져 PostMedia가 undefined가 된다.
jest.mock('../../post', () => ({
  PostHeader: ({ onEditPost }: { onEditPost?: () => void }) =>
    onEditPost ? (
      <button type="button" onClick={onEditPost}>
        start-edit
      </button>
    ) : (
      <div data-testid="post-header" />
    ),
  PostMedia: ({ onPlay, post }: { onPlay: (m: Music) => void; post: Post }) => (
    <button data-testid="play-first-music" onClick={() => post.musics[0] && onPlay(post.musics[0])}>
      play
    </button>
  ),
}));

const { usePostDetail, usePostReactions } = jest.requireMock('@/hooks') as {
  usePostDetail: jest.Mock;
  usePostReactions: jest.Mock;
};
const { enqueueLog } = jest.requireMock('@/utils/logQueue') as { enqueueLog: jest.Mock };
const { updatePost } = jest.requireMock('@/api') as { updatePost: jest.Mock };
const { toast } = jest.requireMock('react-toastify') as { toast: { success: jest.Mock; error: jest.Mock } };

const mockMusic = (overrides: Partial<Music> = {}): Music => ({
  id: 'music-1',
  trackUri: 'uri-1',
  provider: 'YOUTUBE' as Music['provider'],
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
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    useModalStore.setState({ isOpen: false, modalType: null, modalProps: {} });
    usePlayerStore.setState({ currentMusic: null, isPlaying: false });
    queryClient = createTestQueryClient();
    seedAuthMe(queryClient, { userId: 'me', isAuthenticated: true });

    usePostDetail.mockReturnValue({ post: mockPost(), isLoading: false, error: null, updatePostContent: jest.fn() });
    usePostReactions.mockReturnValue({ ...defaultReactions });
    enqueueLog.mockClear();
  });

  it('로그인 사용자가 닫기 버튼으로 모달을 닫으면 enqueueLog가 dwell 정보와 함께 1회 호출된다', () => {
    const post = mockPost();
    usePostDetail.mockReturnValue({ post, isLoading: false, error: null, updatePostContent: jest.fn() });
    openModalFor(post);

    render(<PostCardDetailModal />, { wrapper: createQueryClientWrapper(queryClient) });

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

    const { unmount } = render(<PostCardDetailModal />, { wrapper: createQueryClientWrapper(queryClient) });
    unmount();

    expect(enqueueLog).toHaveBeenCalledTimes(1);
  });

  it('닫기 버튼 클릭 직후 unmount되어도 enqueueLog는 정확히 1회만 호출된다(중복 없음)', () => {
    const post = mockPost();
    usePostDetail.mockReturnValue({ post, isLoading: false, error: null, updatePostContent: jest.fn() });
    openModalFor(post);

    const { unmount } = render(<PostCardDetailModal />, { wrapper: createQueryClientWrapper(queryClient) });
    fireEvent.mouseDown(screen.getByRole('dialog'));
    unmount();

    expect(enqueueLog).toHaveBeenCalledTimes(1);
  });

  it('비로그인 사용자는 모달을 닫아도 enqueueLog가 호출되지 않는다', () => {
    seedAuthMe(queryClient, { userId: null, isAuthenticated: false });
    const post = mockPost();
    usePostDetail.mockReturnValue({ post, isLoading: false, error: null, updatePostContent: jest.fn() });
    openModalFor(post);

    const { unmount } = render(<PostCardDetailModal />, { wrapper: createQueryClientWrapper(queryClient) });
    unmount();

    expect(enqueueLog).not.toHaveBeenCalled();
  });

  it('이 게시글의 음악을 재생 중이면 재생 시간이 listenMsByMusic에 누적된다', async () => {
    const music = mockMusic({ id: 'music-1' });
    const post = mockPost({ musics: [music] });
    usePostDetail.mockReturnValue({ post, isLoading: false, error: null, updatePostContent: jest.fn() });
    openModalFor(post);

    const { unmount } = render(<PostCardDetailModal />, { wrapper: createQueryClientWrapper(queryClient) });

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

    const { unmount } = render(<PostCardDetailModal />, { wrapper: createQueryClientWrapper(queryClient) });

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

    const { container } = render(<PostCardDetailModal />, { wrapper: createQueryClientWrapper(queryClient) });

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

    const { unmount } = render(<PostCardDetailModal />, { wrapper: createQueryClientWrapper(queryClient) });

    fireEvent.click(screen.getByTestId('play-first-music'));
    unmount();

    expect(enqueueLog).toHaveBeenCalledTimes(1);
    const event = enqueueLog.mock.calls[0][0];
    expect(event.meta.playedMusicCount).toBe(1);
  });
});

describe('PostCardDetailModal — 편집/라우팅전환/좋아요한사용자목록 특성화 테스트 (post-detail-modal-responsibility-decomposition #126)', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    useModalStore.setState({ isOpen: false, modalType: null, modalProps: {} });
    usePlayerStore.setState({ currentMusic: null, isPlaying: false });
    queryClient = createTestQueryClient();
    seedAuthMe(queryClient, { userId: 'author-1', isAuthenticated: true });

    usePostReactions.mockReturnValue({ ...defaultReactions });
    mockPush.mockClear();
    mockUsePathname.mockReturnValue('/');
    mockUseIsMobile.mockReturnValue(false);
    updatePost.mockReset();
    toast.success.mockClear();
    toast.error.mockClear();
  });

  it('편집 시작 후 저장에 성공하면 updatePostContent가 갱신되고 편집모드가 종료된다', async () => {
    const post = mockPost({ content: 'original', author: { id: 'author-1', nickname: 'author', profileImgUrl: null } });
    const updatePostContent = jest.fn();
    usePostDetail.mockReturnValue({ post, isLoading: false, error: null, updatePostContent });
    updatePost.mockResolvedValue(undefined);
    openModalFor(post);

    render(<PostCardDetailModal />, { wrapper: createQueryClientWrapper(queryClient) });

    fireEvent.click(screen.getByText('start-edit'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'updated content' } });
    fireEvent.click(screen.getByText('저장'));

    // commit()은 onCommit(updatePost→toast→캐시 동기화) 완료 후에야 편집모드를 닫으므로,
    // textarea가 사라지는 시점을 기다리면 그 이전 단계가 전부 끝났음을 보장한다.
    await waitFor(() => {
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    expect(updatePost).toHaveBeenCalledWith('post-1', { content: 'updated content' });
    expect(updatePostContent).toHaveBeenCalledWith('updated content');
    expect(toast.success).toHaveBeenCalled();
  });

  it('편집 저장이 실패하면 토스트 에러가 뜨고 편집모드가 유지된다', async () => {
    const post = mockPost({ content: 'original', author: { id: 'author-1', nickname: 'author', profileImgUrl: null } });
    usePostDetail.mockReturnValue({ post, isLoading: false, error: null, updatePostContent: jest.fn() });
    updatePost.mockRejectedValue(new Error('fail'));
    openModalFor(post);

    render(<PostCardDetailModal />, { wrapper: createQueryClientWrapper(queryClient) });

    fireEvent.click(screen.getByText('start-edit'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'updated content' } });
    fireEvent.click(screen.getByText('저장'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });

    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('편집을 취소하면 draft가 원본 content로 복귀하고 편집모드가 종료된다', () => {
    const post = mockPost({ content: 'original', author: { id: 'author-1', nickname: 'author', profileImgUrl: null } });
    usePostDetail.mockReturnValue({ post, isLoading: false, error: null, updatePostContent: jest.fn() });
    openModalFor(post);

    render(<PostCardDetailModal />, { wrapper: createQueryClientWrapper(queryClient) });

    fireEvent.click(screen.getByText('start-edit'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'changed' } });
    fireEvent.click(screen.getByText('취소'));

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('start-edit'));
    expect(screen.getByRole('textbox')).toHaveValue('original');
  });

  it('리사이즈로 데스크탑→모바일 전환 시 프로필 페이지에서 열린 모달이면 posts 피드로 전환된다', () => {
    mockUsePathname.mockReturnValue('/profile/author-1');
    mockUseIsMobile.mockReturnValue(false);
    const post = mockPost();
    usePostDetail.mockReturnValue({ post, isLoading: false, error: null, updatePostContent: jest.fn() });
    openModalFor(post);

    const { rerender } = render(<PostCardDetailModal />, { wrapper: createQueryClientWrapper(queryClient) });

    mockUseIsMobile.mockReturnValue(true);
    rerender(<PostCardDetailModal />);

    expect(mockPush).toHaveBeenCalledWith('/profile/author-1/posts?postId=post-1');
    expect(useModalStore.getState().isOpen).toBe(false);
  });

  it('좋아요한 사용자 목록을 열면 LikedUsersOverlay가 열린다', () => {
    const post = mockPost();
    usePostDetail.mockReturnValue({ post, isLoading: false, error: null, updatePostContent: jest.fn() });
    openModalFor(post);

    render(<PostCardDetailModal />, { wrapper: createQueryClientWrapper(queryClient) });

    expect(screen.queryByTestId('liked-users-overlay-open')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('open-liked-users'));

    expect(screen.getByTestId('liked-users-overlay-open')).toBeInTheDocument();
  });
});
