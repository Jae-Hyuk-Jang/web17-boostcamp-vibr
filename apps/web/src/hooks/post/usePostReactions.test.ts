import { renderHook, waitFor, act } from '@testing-library/react';
import type { PostResponseDto as Post } from '@repo/dto';

import usePostReactions, { getEffectivePollMs } from './usePostReactions';
import { postDetailQueryKey } from './usePostDetail';
import { createTestQueryClient, createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';

jest.mock('@/api/internal', () => ({
  addLike: jest.fn(),
  removeLike: jest.fn(),
  getComments: jest.fn(),
  createComment: jest.fn(),
}));

jest.mock('@/api/internal/auth', () => ({
  authMe: jest.fn(),
}));

const { addLike, removeLike, getComments, createComment } = jest.requireMock('@/api/internal') as {
  addLike: jest.Mock;
  removeLike: jest.Mock;
  getComments: jest.Mock;
  createComment: jest.Mock;
};
const { authMe } = jest.requireMock('@/api/internal/auth') as { authMe: jest.Mock };

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

describe('usePostReactions — 게시글 반응 상태 특성화 테스트 (상세 모달 측)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getComments.mockResolvedValue({ comments: [] });
    authMe.mockResolvedValue({ id: 'me', nickname: 'me', profileImgUrl: null });
  });

  it('[카드 ↔ 모달 동기화] toggleLike 성공 시 postDetailQueryKey 캐시를 갱신하고, 이는 카드가 읽는 것과 동일한 키다', async () => {
    addLike.mockResolvedValue({});
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(postDetailQueryKey('post-1'), mockPost({ isLiked: false, likeCount: 3 }));

    const { result } = renderHook(() => usePostReactions({ enabled: true, postId: 'post-1', initialIsLiked: false, initialLikeCount: 3 }), {
      wrapper: createQueryClientWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      await result.current.toggleLike();
    });

    expect(result.current.isLiked).toBe(true);
    expect(result.current.likeCount).toBe(4);
    expect(addLike).toHaveBeenCalledWith({ postId: 'post-1' });

    // PostCard.tsx(usePostCacheSync)가 읽는 것과 정확히 같은 캐시 키
    expect(queryClient.getQueryData(postDetailQueryKey('post-1'))).toMatchObject({ isLiked: true, likeCount: 4 });
  });

  it('toggleLike 실패 시 로컬 상태와 캐시 모두 롤백된다', async () => {
    removeLike.mockRejectedValue(new Error('network error'));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(postDetailQueryKey('post-1'), mockPost({ isLiked: true, likeCount: 5 }));

    const { result } = renderHook(() => usePostReactions({ enabled: true, postId: 'post-1', initialIsLiked: true, initialLikeCount: 5 }), {
      wrapper: createQueryClientWrapper(queryClient),
    });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      await result.current.toggleLike();
    });

    expect(result.current.isLiked).toBe(true);
    expect(result.current.likeCount).toBe(5);
    expect(queryClient.getQueryData(postDetailQueryKey('post-1'))).toMatchObject({ isLiked: true, likeCount: 5 });
  });

  it('[재현·버그 후보] authMe() 응답이 오기 전에 좋아요를 누르면, 실제로는 로그인 사용자여도 조용히 아무 일도 일어나지 않는다', async () => {
    addLike.mockResolvedValue({});
    let resolveAuthMe!: (value: { id: string; nickname: string; profileImgUrl: string | null }) => void;
    authMe.mockReturnValue(
      new Promise((resolve) => {
        resolveAuthMe = resolve;
      }),
    );

    const { result } = renderHook(() => usePostReactions({ enabled: true, postId: 'post-1', initialIsLiked: false, initialLikeCount: 3 }), {
      wrapper: createQueryClientWrapper(),
    });

    // authMe()가 아직 resolve되지 않은 시점 — isAuthenticated는 초기값 false를 유지 중
    expect(result.current.isAuthenticated).toBe(false);

    await act(async () => {
      await result.current.toggleLike();
    });

    // PostCard였다면 전역 useAuthStore를 그대로 참조해 이미 true였을 수 있는 타이밍인데,
    // usePostReactions는 자체 authMe() 판정에 의존하기 때문에 여기서는 토글이 무시된다.
    expect(addLike).not.toHaveBeenCalled();
    expect(result.current.isLiked).toBe(false);

    await act(async () => {
      resolveAuthMe({ id: 'me', nickname: 'me', profileImgUrl: null });
    });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
  });

  it('[카드 ↔ 모달 동기화] 댓글 작성 성공 시(서버가 read-after-write를 보장하는 경우) postDetailQueryKey 캐시의 commentCount를 갱신한다', async () => {
    createComment.mockResolvedValue({ id: 'server-comment-1' });
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(postDetailQueryKey('post-1'), mockPost({ commentCount: 0 }));

    const { result } = renderHook(() => usePostReactions({ enabled: true, postId: 'post-1', initialIsLiked: false, initialLikeCount: 0 }), {
      wrapper: createQueryClientWrapper(queryClient),
    });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    act(() => {
      result.current.setCommentText('안녕하세요');
    });

    // submitComment 내부의 refetchComments()가 부르는 getComments가 방금 생성된 댓글을 반영한다고 가정
    // (서버가 read-after-write consistency를 보장하는 "정상" 케이스). 이 가정이 항상 성립하지는 않는다는 것을
    // 아래 [재현·버그 #39] 테스트에서 별도로 검증한다.
    getComments.mockResolvedValue({
      comments: [
        {
          id: 'server-comment-1',
          content: '안녕하세요',
          createdAt: new Date().toISOString(),
          author: { id: 'me', nickname: 'me', profileImgUrl: null },
        },
      ],
    });

    await act(async () => {
      await result.current.submitComment();
    });

    await waitFor(() => expect(queryClient.getQueryData(postDetailQueryKey('post-1'))).toMatchObject({ commentCount: 1 }));
    expect(result.current.commentCount).toBe(1);
  });

  it('[수정 완료·버그 #39] 댓글 작성 직후 폴링(getComments)의 서버 응답이 아직 새 댓글을 포함하지 않아도, 방금 작성한 댓글이 사라지지 않는다', async () => {
    // createComment는 성공하지만(실제로는 서버에 저장됨), getComments는 계속 빈 목록만 반환한다고 가정
    // — 캐시 지연/읽기 replica lag/네트워크 순서 역전 등으로 실무에서 충분히 발생할 수 있는 타이밍이다.
    // 고쳐진 구현은 mutation 성공 직후 refetch를 다시 부르지 않고 mutation이 캐시에 반영한 tmp->서버 id
    // 치환 결과를 그대로 신뢰하므로, 이 스냅샷이 새 댓글을 아직 반영하지 않았어도 화면에서 사라지지 않는다.
    createComment.mockResolvedValue({ id: 'server-comment-1' });
    getComments.mockResolvedValue({ comments: [] });
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(postDetailQueryKey('post-1'), mockPost({ commentCount: 0 }));

    const { result } = renderHook(() => usePostReactions({ enabled: true, postId: 'post-1', initialIsLiked: false, initialLikeCount: 0 }), {
      wrapper: createQueryClientWrapper(queryClient),
    });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    act(() => {
      result.current.setCommentText('방금 쓴 댓글');
    });
    await act(async () => {
      await result.current.submitComment();
    });

    await waitFor(() => expect(result.current.comments).toHaveLength(1));
    expect(result.current.comments[0]).toMatchObject({ id: 'server-comment-1', content: '방금 쓴 댓글' });
    expect(result.current.commentCount).toBe(1);
    expect(queryClient.getQueryData(postDetailQueryKey('post-1'))).toMatchObject({ commentCount: 1 });
  });

  it('댓글 작성 실패 시 낙관적으로 추가했던 임시 댓글이 제거되고 캐시의 댓글 수도 되돌아간다', async () => {
    createComment.mockRejectedValue(new Error('network error'));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(postDetailQueryKey('post-1'), mockPost({ commentCount: 0 }));

    const { result } = renderHook(() => usePostReactions({ enabled: true, postId: 'post-1', initialIsLiked: false, initialLikeCount: 0 }), {
      wrapper: createQueryClientWrapper(queryClient),
    });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    act(() => {
      result.current.setCommentText('실패할 댓글');
    });
    await act(async () => {
      await result.current.submitComment();
    });

    await waitFor(() => expect(result.current.comments).toHaveLength(0));
    expect(queryClient.getQueryData(postDetailQueryKey('post-1'))).toMatchObject({ commentCount: 0 });
  });

  it('[회귀 안전망 #44] 좋아요 요청이 진행 중일 때 다시 toggleLike를 호출해도 API가 한 번만 호출된다', async () => {
    let resolveAddLike!: (value: unknown) => void;
    addLike.mockReturnValue(
      new Promise((resolve) => {
        resolveAddLike = resolve;
      }),
    );

    const { result } = renderHook(() => usePostReactions({ enabled: true, postId: 'post-1', initialIsLiked: false, initialLikeCount: 3 }), {
      wrapper: createQueryClientWrapper(),
    });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    let firstCall!: Promise<void>;
    act(() => {
      firstCall = result.current.toggleLike(); // 첫 호출 — 아직 응답 안 옴
    });
    await act(async () => {
      await result.current.toggleLike(); // 진행 중에 재호출
    });

    expect(addLike).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveAddLike({});
      await firstCall;
    });
  });

  it('[회귀 안전망 #44] usePostReactions의 반환 객체는 고정된 13개 필드를 그대로 유지한다 (usePostLikeToggle 합성 전환 시 계약)', async () => {
    const { result } = renderHook(() => usePostReactions({ enabled: true, postId: 'post-1', initialIsLiked: false, initialLikeCount: 0 }), {
      wrapper: createQueryClientWrapper(),
    });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    const expectedKeys = [
      'isAuthenticated',
      'isLiked',
      'likeCount',
      'toggleLike',
      'isSubmittingLike',
      'comments',
      'isCommentsLoading',
      'commentText',
      'setCommentText',
      'submitComment',
      'isSubmittingComment',
      'commentCount',
      'refetchComments',
    ].sort();

    expect(Object.keys(result.current).sort()).toEqual(expectedKeys);
    expect(typeof result.current.toggleLike).toBe('function');
    expect(typeof result.current.submitComment).toBe('function');
    expect(typeof result.current.setCommentText).toBe('function');
    expect(typeof result.current.refetchComments).toBe('function');
    expect(typeof result.current.isLiked).toBe('boolean');
    expect(typeof result.current.likeCount).toBe('number');
    expect(typeof result.current.isSubmittingLike).toBe('boolean');
  });

  it('[Behavior Invariant] getEffectivePollMs — 탭이 숨겨지면 폴링 주기가 6배(최소 30초)로 늘어난다', () => {
    const originalVisibilityState = document.visibilityState;
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    expect(getEffectivePollMs(5000)).toBe(5000);

    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    expect(getEffectivePollMs(5000)).toBe(30000); // 5000*6=30000, 최소 30초 바닥과 동일
    expect(getEffectivePollMs(1000)).toBe(30000); // 1000*6=6000 < 30000 바닥 → 바닥값 적용

    Object.defineProperty(document, 'visibilityState', { value: originalVisibilityState, configurable: true });
  });

  it('[Behavior Invariant] 입력 중이면 폴링 주기가 지나도 댓글을 다시 조회하지 않는다', async () => {
    getComments.mockResolvedValue({ comments: [] });

    const { result } = renderHook(
      () => usePostReactions({ enabled: true, postId: 'post-1', initialIsLiked: false, initialLikeCount: 0, pollMs: 1000 }),
      { wrapper: createQueryClientWrapper() },
    );
    await waitFor(() => expect(getComments).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.setCommentText('입력 중');
    });

    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(getComments).toHaveBeenCalledTimes(1);
  });

  it('[Behavior Invariant] 댓글 전송 중이면 폴링 주기가 지나도 댓글을 다시 조회하지 않는다', async () => {
    getComments.mockResolvedValue({ comments: [] });
    let resolveCreateComment!: (value: { id: string }) => void;
    createComment.mockReturnValue(
      new Promise((resolve) => {
        resolveCreateComment = resolve;
      }),
    );

    const { result } = renderHook(
      () => usePostReactions({ enabled: true, postId: 'post-1', initialIsLiked: false, initialLikeCount: 0, pollMs: 1000 }),
      { wrapper: createQueryClientWrapper() },
    );
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    await waitFor(() => expect(getComments).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.setCommentText('전송 중인 댓글');
    });
    let submitPromise!: Promise<void>;
    act(() => {
      submitPromise = result.current.submitComment();
    });
    await waitFor(() => expect(result.current.isSubmittingComment).toBe(true));

    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(getComments).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveCreateComment({ id: 'server-comment-1' });
      await submitPromise;
    });
  });
});
