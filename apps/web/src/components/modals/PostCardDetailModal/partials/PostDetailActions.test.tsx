import { render, screen, fireEvent } from '@testing-library/react';

import PostDetailActions from './PostDetailActions';
import { PostDetailReactionsProvider } from '../PostDetailReactionsContext';
import type { UsePostDetailModalResult } from '@/hooks/post/usePostDetailModal';

type Reactions = UsePostDetailModalResult['reactions'];

const mockReactions = (overrides: Partial<Reactions> = {}): Reactions => ({
  isAuthenticated: true,
  isLiked: false,
  likeCount: 3,
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
  postId: 'post-1',
  onOpenLikedUsers: jest.fn(),
};

const renderWithReactions = (reactionsOverrides: Partial<Reactions> = {}) =>
  render(
    <PostDetailReactionsProvider value={mockReactions(reactionsOverrides)}>
      <PostDetailActions {...baseProps} />
    </PostDetailReactionsProvider>,
  );

describe('PostDetailActions', () => {
  beforeEach(() => {
    baseProps.onOpenLikedUsers = jest.fn();
  });

  it('좋아요 개수를 표시한다', () => {
    renderWithReactions({ likeCount: 7 });
    expect(screen.getByText('좋아요 7개')).toBeInTheDocument();
  });

  it('좋아요 버튼을 클릭하면 toggleLike가 호출된다', () => {
    const toggleLike = jest.fn();
    renderWithReactions({ toggleLike });

    fireEvent.click(screen.getByTitle('좋아요'));
    expect(toggleLike).toHaveBeenCalledTimes(1);
  });

  it('비로그인 상태면 좋아요 버튼이 비활성화된다', () => {
    renderWithReactions({ isAuthenticated: false });
    expect(screen.getByTitle('로그인 후 사용 가능')).toBeDisabled();
  });

  it('제출 중이면 좋아요 버튼이 비활성화된다', () => {
    renderWithReactions({ isSubmittingLike: true });
    expect(screen.getByTitle('좋아요')).toBeDisabled();
  });

  it('좋아요 개수 버튼을 클릭하면 onOpenLikedUsers가 호출된다', () => {
    renderWithReactions({ likeCount: 3 });
    fireEvent.click(screen.getByText('좋아요 3개'));
    expect(baseProps.onOpenLikedUsers).toHaveBeenCalledTimes(1);
  });
});
