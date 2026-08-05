import { render, screen } from '@testing-library/react';
import type { GetCommentsResDto, PostResponseDto as Post } from '@repo/dto';

import PostDetailBody from './PostDetailBody';
import { PostDetailModalValueProvider } from '../PostDetailModalContext';
import { PostDetailReactionsProvider } from '../PostDetailReactionsContext';
import type { UsePostDetailModalResult } from '@/hooks/post/usePostDetailModal';

type CommentItem = GetCommentsResDto['comments'][number];
type Reactions = UsePostDetailModalResult['reactions'];
type ContextValue = Parameters<typeof PostDetailModalValueProvider>[0]['value'];

const mockComment = (overrides: Partial<CommentItem> = {}): CommentItem => ({
  id: 'comment-1',
  content: '댓글 내용',
  createdAt: '2026-08-04T00:00:00.000Z',
  author: { id: 'user-1', nickname: '댓글작성자', profileImgUrl: null },
  ...overrides,
});

const mockReactions = (overrides: Partial<Reactions> = {}): Reactions => ({
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
  ...overrides,
});

const mockPost = (overrides: Partial<Post> = {}): Post =>
  ({
    id: 'post-1',
    content: '게시글 본문',
    author: { id: 'author-1', nickname: '작성자', profileImgUrl: null },
    ...overrides,
  }) as Post;

// PostDetailBody가 실제로 쓰는 건 safePost/profileImg뿐이지만, 컨텍스트 타입 전체를 채워야 한다 —
// 나머지 필드는 이 컴포넌트가 참조하지 않으므로 최소한의 더미 값으로 둔다.
const mockContextValue = (overrides: Partial<Pick<UsePostDetailModalResult, 'safePost' | 'profileImg'>> = {}): ContextValue =>
  ({
    isEnabled: true,
    postId: 'post-1',
    safePost: mockPost(),
    isLoading: false,
    error: null,
    isOwner: false,
    profileImg: '/profile.png',
    reactions: {} as UsePostDetailModalResult['reactions'],
    likedUsers: {} as UsePostDetailModalResult['likedUsers'],
    editing: {} as UsePostDetailModalResult['editing'],
    player: {} as UsePostDetailModalResult['player'],
    handleClose: jest.fn(),
    closeModal: jest.fn(),
    handleUserClick: jest.fn(),
    ...overrides,
  }) as ContextValue;

const renderWithProviders = (
  contextOverrides: Partial<Pick<UsePostDetailModalResult, 'safePost' | 'profileImg'>> = {},
  reactionsOverrides: Partial<Reactions> = {},
  props: { hideAuthorRow?: boolean } = {},
) =>
  render(
    <PostDetailModalValueProvider value={mockContextValue(contextOverrides)}>
      <PostDetailReactionsProvider value={mockReactions(reactionsOverrides)}>
        <PostDetailBody {...props} />
      </PostDetailReactionsProvider>
    </PostDetailModalValueProvider>,
  );

describe('PostDetailBody', () => {
  it('hideAuthorRow가 없으면 작성자 정보와 본문을 렌더링한다', () => {
    renderWithProviders();

    expect(screen.getByText('작성자')).toBeInTheDocument();
    expect(screen.getByText('게시글 본문')).toBeInTheDocument();
  });

  it('hideAuthorRow가 true면 작성자 정보와 본문을 렌더링하지 않는다', () => {
    renderWithProviders({}, {}, { hideAuthorRow: true });

    expect(screen.queryByText('작성자')).not.toBeInTheDocument();
    expect(screen.queryByText('게시글 본문')).not.toBeInTheDocument();
  });

  it('isCommentsLoading이 true면 로딩 스피너를 보여주고 댓글 목록/빈 상태 메시지는 렌더링하지 않는다', () => {
    renderWithProviders({}, { isCommentsLoading: true, comments: [mockComment()] });

    expect(screen.queryByText('댓글 내용')).not.toBeInTheDocument();
    expect(screen.queryByText('아직 댓글이 없습니다.')).not.toBeInTheDocument();
  });

  it('댓글이 없고 로딩 중이 아니면 빈 상태 메시지를 보여준다', () => {
    renderWithProviders({}, { comments: [], isCommentsLoading: false });

    expect(screen.getByText('아직 댓글이 없습니다.')).toBeInTheDocument();
  });

  it('댓글이 있으면 목록을 렌더링한다', () => {
    renderWithProviders(
      {},
      {
        comments: [mockComment({ id: 'c1', content: '첫 댓글' }), mockComment({ id: 'c2', content: '두 번째 댓글' })],
      },
    );

    expect(screen.getByText('첫 댓글')).toBeInTheDocument();
    expect(screen.getByText('두 번째 댓글')).toBeInTheDocument();
    expect(screen.queryByText('아직 댓글이 없습니다.')).not.toBeInTheDocument();
  });
});
