import { render, screen, fireEvent } from '@testing-library/react';

import PostDetailActions from './PostDetailActions';

const baseProps = {
  isAuthenticated: true,
  isSubmitting: false,
  isLiked: false,
  likeCount: 3,
  postId: 'post-1',
  onToggleLike: jest.fn(),
  onOpenLikedUsers: jest.fn(),
};

describe('PostDetailActions', () => {
  beforeEach(() => {
    baseProps.onToggleLike = jest.fn();
    baseProps.onOpenLikedUsers = jest.fn();
  });

  it('좋아요 개수를 표시한다', () => {
    render(<PostDetailActions {...baseProps} likeCount={7} />);
    expect(screen.getByText('좋아요 7개')).toBeInTheDocument();
  });

  it('좋아요 버튼을 클릭하면 onToggleLike가 호출된다', () => {
    render(<PostDetailActions {...baseProps} />);
    fireEvent.click(screen.getByTitle('좋아요'));
    expect(baseProps.onToggleLike).toHaveBeenCalledTimes(1);
  });

  it('비로그인 상태면 좋아요 버튼이 비활성화된다', () => {
    render(<PostDetailActions {...baseProps} isAuthenticated={false} />);
    expect(screen.getByTitle('로그인 후 사용 가능')).toBeDisabled();
  });

  it('제출 중이면 좋아요 버튼이 비활성화된다', () => {
    render(<PostDetailActions {...baseProps} isSubmitting />);
    expect(screen.getByTitle('좋아요')).toBeDisabled();
  });

  it('좋아요 개수 버튼을 클릭하면 onOpenLikedUsers가 호출된다', () => {
    render(<PostDetailActions {...baseProps} />);
    fireEvent.click(screen.getByText('좋아요 3개'));
    expect(baseProps.onOpenLikedUsers).toHaveBeenCalledTimes(1);
  });
});
