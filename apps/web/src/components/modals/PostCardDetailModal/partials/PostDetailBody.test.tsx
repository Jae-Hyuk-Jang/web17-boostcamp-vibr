import { render, screen } from '@testing-library/react';
import type { GetCommentsResDto } from '@repo/dto';

import PostDetailBody from './PostDetailBody';
import { PostDetailReactionsProvider } from '../PostDetailReactionsContext';
import type { UsePostDetailModalResult } from '@/hooks/post/usePostDetailModal';

type CommentItem = GetCommentsResDto['comments'][number];
type Reactions = UsePostDetailModalResult['reactions'];

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

const baseProps = {
  profileImg: '/profile.png',
  nickname: '작성자',
  content: '게시글 본문',
  hideAuthorRow: undefined as boolean | undefined,
};

const renderWithReactions = (reactionsOverrides: Partial<Reactions> = {}, props: Partial<typeof baseProps> = {}) =>
  render(
    <PostDetailReactionsProvider value={mockReactions(reactionsOverrides)}>
      <PostDetailBody {...baseProps} {...props} />
    </PostDetailReactionsProvider>,
  );

describe('PostDetailBody', () => {
  it('hideAuthorRow가 없으면 작성자 정보와 본문을 렌더링한다', () => {
    renderWithReactions();

    expect(screen.getByText('작성자')).toBeInTheDocument();
    expect(screen.getByText('게시글 본문')).toBeInTheDocument();
  });

  it('hideAuthorRow가 true면 작성자 정보와 본문을 렌더링하지 않는다', () => {
    renderWithReactions({}, { hideAuthorRow: true });

    expect(screen.queryByText('작성자')).not.toBeInTheDocument();
    expect(screen.queryByText('게시글 본문')).not.toBeInTheDocument();
  });

  it('isCommentsLoading이 true면 로딩 스피너를 보여주고 댓글 목록/빈 상태 메시지는 렌더링하지 않는다', () => {
    renderWithReactions({ isCommentsLoading: true, comments: [mockComment()] });

    expect(screen.queryByText('댓글 내용')).not.toBeInTheDocument();
    expect(screen.queryByText('아직 댓글이 없습니다.')).not.toBeInTheDocument();
  });

  it('댓글이 없고 로딩 중이 아니면 빈 상태 메시지를 보여준다', () => {
    renderWithReactions({ comments: [], isCommentsLoading: false });

    expect(screen.getByText('아직 댓글이 없습니다.')).toBeInTheDocument();
  });

  it('댓글이 있으면 목록을 렌더링한다', () => {
    renderWithReactions({
      comments: [mockComment({ id: 'c1', content: '첫 댓글' }), mockComment({ id: 'c2', content: '두 번째 댓글' })],
    });

    expect(screen.getByText('첫 댓글')).toBeInTheDocument();
    expect(screen.getByText('두 번째 댓글')).toBeInTheDocument();
    expect(screen.queryByText('아직 댓글이 없습니다.')).not.toBeInTheDocument();
  });
});
