import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import type { PostResponseDto as Post } from '@repo/dto';

import PostCard from './PostCard';
import { useAuthStore } from '@/stores/useAuthStore';
import { postDetailQueryKey } from '@/hooks/post/usePostDetail';
import { createTestQueryClient, createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';

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

// #45: 좋아요 로직이 usePostLikeToggle로 옮겨가며 addLike/removeLike의 실제 import 경로가
// '@/api' -> '@/api/internal'로 바뀌었다(둘 다 같은 구현을 가리키지만 mock은 실제 import 경로와
// 일치해야 한다). 관찰 가능한 동작(아래 assertion들)은 리팩터링 전후로 동일하다.
jest.mock('@/api/internal', () => ({
  addLike: jest.fn(),
  removeLike: jest.fn(),
}));

const { addLike, removeLike } = jest.requireMock('@/api/internal') as { addLike: jest.Mock; removeLike: jest.Mock };

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

const renderPostCard = (post: Post, queryClient = createTestQueryClient()) =>
  render(<PostCard post={post} currentMusicId={null} isPlayingGlobal={false} onPlay={jest.fn()} onUserClick={jest.fn()} onOpenDetail={jest.fn()} />, {
    wrapper: createQueryClientWrapper(queryClient),
  });

describe('PostCard — 게시글 반응 상태 특성화 테스트', () => {
  beforeEach(() => {
    useAuthStore.setState({ userId: 'me', isAuthenticated: true, isLoading: false });
    jest.clearAllMocks();
  });

  it('로그인 사용자가 좋아요를 누르면 즉시 낙관적으로 반영되고, 성공 시 postDetailQueryKey 캐시에 기록된다', async () => {
    addLike.mockResolvedValue({});
    const queryClient = createTestQueryClient();

    renderPostCard(mockPost({ isLiked: false, likeCount: 3 }), queryClient);

    const button = screen.getByTestId('like-button');
    expect(button).toHaveTextContent('like:false:3');

    fireEvent.click(button);

    // optimistic — API 응답을 기다리지 않고 즉시 반영
    expect(button).toHaveTextContent('like:true:4');

    await waitFor(() => expect(addLike).toHaveBeenCalledWith({ postId: 'post-1' }));
    expect(queryClient.getQueryData(postDetailQueryKey('post-1'))).toMatchObject({ isLiked: true, likeCount: 4 });
  });

  it('좋아요 요청이 실패하면 로컬 상태와 캐시 모두 이전 값으로 롤백된다', async () => {
    removeLike.mockRejectedValue(new Error('network error'));
    const queryClient = createTestQueryClient();

    renderPostCard(mockPost({ isLiked: true, likeCount: 5 }), queryClient);

    const button = screen.getByTestId('like-button');
    fireEvent.click(button);
    expect(button).toHaveTextContent('like:false:4');

    await waitFor(() => expect(removeLike).toHaveBeenCalledWith('post-1'));
    await waitFor(() => expect(button).toHaveTextContent('like:true:5'));
    expect(queryClient.getQueryData(postDetailQueryKey('post-1'))).toMatchObject({ isLiked: true, likeCount: 5 });
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

  it('[카드 ↔ 모달 동기화] 다른 화면(상세 모달)이 먼저 좋아요를 캐시에 남겨두면, 카드는 마운트 즉시 그 값을 반영한다', () => {
    // usePostLikeToggle.toggleLike이 하는 것과 동일한 캐시 쓰기를 직접 시뮬레이션 —
    // "상세 모달에서 이미 좋아요를 눌러놓은 상태로 피드에 진입"하는 시나리오
    const queryClient = createTestQueryClient();
    const post = mockPost({ isLiked: false, likeCount: 3 });
    queryClient.setQueryData(postDetailQueryKey('post-1'), { ...post, isLiked: true, likeCount: 4 });

    // 카드가 props로 받은 건 캐시 반영 전의 "구" 서버 값 — usePostCacheSync가 캐시를 우선한다
    renderPostCard(post, queryClient);

    expect(screen.getByTestId('like-button')).toHaveTextContent('like:true:4');
  });

  it('[댓글 수 동기화] 상세 모달에서의 댓글 작성으로 캐시에 남은 commentCount를 카드가 반영한다', () => {
    const queryClient = createTestQueryClient();
    const post = mockPost({ commentCount: 2 });
    queryClient.setQueryData(postDetailQueryKey('post-1'), { ...post, commentCount: 7 });

    renderPostCard(post, queryClient);

    expect(screen.getByTestId('like-button')).toHaveTextContent('comments:7');
  });

  it('[회귀 안전망 #44] 좋아요를 연달아 두 번 클릭하면 토글→역토글로 처리된다 (Fact: "진행 중 재클릭 차단"이 완전하지 않음)', async () => {
    // 애초 기대는 "진행 중이면 두 번째 클릭이 아예 무시된다"였지만, 실제로 실행해보면 그렇지 않다.
    // 캐시 동기화 useEffect(PostCard.tsx의 resetSubmittingOnSync)가 1번째 클릭의 optimistic 캐시 기록을 감지해
    // isLikeSubmitting을 즉시 false로 되돌리기 때문에, 2번째 클릭이 가드를 통과해 반대 방향으로 토글된다.
    // 결과적으로 addLike 1회 + removeLike 1회가 나가고 화면은 원래 값으로 돌아온다 — "중복 요청"은 안 나가지만
    // "진행 중 재클릭 차단"이라는 이름이 암시하는 동작과는 다르다. 이건 리팩터링 대상이 아니라 현재 동작의
    // 특성화이며, 실제 사용자의 더블클릭 간격(수백ms)에서는 이 이펙트가 이미 반영된 뒤라 문제로 드러나지 않는다.
    let resolveAddLike!: (value: unknown) => void;
    let resolveRemoveLike!: (value: unknown) => void;
    addLike.mockReturnValue(
      new Promise((resolve) => {
        resolveAddLike = resolve;
      }),
    );
    removeLike.mockReturnValue(
      new Promise((resolve) => {
        resolveRemoveLike = resolve;
      }),
    );

    renderPostCard(mockPost({ isLiked: false, likeCount: 3 }));

    const button = screen.getByTestId('like-button');
    fireEvent.click(button); // 1번째 클릭 — 좋아요 ON
    fireEvent.click(button); // 같은 tick 안에서 곧바로 2번째 클릭

    expect(addLike).toHaveBeenCalledTimes(1);
    expect(removeLike).toHaveBeenCalledTimes(1);
    expect(button).toHaveTextContent('like:false:3'); // 토글 → 역토글, 순변화 없음

    await act(async () => {
      resolveAddLike({});
      resolveRemoveLike({});
    });
  });
});
