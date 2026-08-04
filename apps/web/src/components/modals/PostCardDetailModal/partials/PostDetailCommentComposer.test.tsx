import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import PostDetailCommentComposer from './PostDetailCommentComposer';
import { PostDetailReactionsProvider } from '../PostDetailReactionsContext';
import type { UsePostDetailModalResult } from '@/hooks/post/usePostDetailModal';

type Reactions = UsePostDetailModalResult['reactions'];

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

const renderWithReactions = (reactionsOverrides: Partial<Reactions> = {}) =>
  render(
    <PostDetailReactionsProvider value={mockReactions(reactionsOverrides)}>
      <PostDetailCommentComposer />
    </PostDetailReactionsProvider>,
  );

describe('PostDetailCommentComposer', () => {
  it('비로그인 상태면 로그인 안내 placeholder를 보여주고 입력창이 비활성화된다', () => {
    renderWithReactions({ isAuthenticated: false });

    const textarea = screen.getByPlaceholderText('로그인 후 댓글을 작성할 수 있어요.');
    expect(textarea).toBeDisabled();
  });

  it('입력값이 바뀌면 setCommentText가 호출된다', () => {
    const setCommentText = jest.fn();
    renderWithReactions({ setCommentText });

    const textarea = screen.getByPlaceholderText('댓글 달기... (Enter 전송 / Shift+Enter 줄바꿈)');
    fireEvent.change(textarea, { target: { value: '새 댓글' } });

    expect(setCommentText).toHaveBeenCalledWith('새 댓글');
  });

  it('빈 값이면 전송 버튼이 비활성화된다', () => {
    renderWithReactions({ commentText: '' });
    expect(screen.getByTitle('전송')).toBeDisabled();
  });

  it('값이 있으면 전송 버튼이 활성화되고, 클릭하면 submitComment가 호출된다', () => {
    const submitComment = jest.fn();
    renderWithReactions({ commentText: '댓글 내용', submitComment });

    const submitButton = screen.getByTitle('전송');
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);
    expect(submitComment).toHaveBeenCalledTimes(1);
  });

  it('제출 중이면 전송 버튼이 비활성화된다', () => {
    renderWithReactions({ commentText: '댓글 내용', isSubmittingComment: true });
    expect(screen.getByTitle('전송')).toBeDisabled();
  });

  it('Enter 키를 누르면 submitComment가 호출된다', () => {
    const submitComment = jest.fn();
    renderWithReactions({ commentText: '댓글 내용', submitComment });

    const textarea = screen.getByPlaceholderText('댓글 달기... (Enter 전송 / Shift+Enter 줄바꿈)');
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(submitComment).toHaveBeenCalledTimes(1);
  });

  it('Shift+Enter를 누르면 submitComment가 호출되지 않는다', () => {
    const submitComment = jest.fn();
    renderWithReactions({ commentText: '댓글 내용', submitComment });

    const textarea = screen.getByPlaceholderText('댓글 달기... (Enter 전송 / Shift+Enter 줄바꿈)');
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    expect(submitComment).not.toHaveBeenCalled();
  });

  it('Desktop/Mobile 두 인스턴스가 항상 동시에 마운트돼 있어도(리사이즈 전환 시나리오), 같은 Provider 하나를 공유하므로 입력 텍스트가 서로 어긋나지 않는다', () => {
    // PostCardDetailModal.tsx가 실제로 하는 것처럼 Provider 하나로 두 인스턴스를 감싼다 —
    // usePostReactions가 leaf마다 독립 호출됐다면(ADR에서 기각한 안 3) 이 텍스트가 갈라졌을 것이다.
    function TwoInstancesUnderOneProvider() {
      const [commentText, setCommentText] = useState('');
      return (
        <PostDetailReactionsProvider value={mockReactions({ commentText, setCommentText })}>
          <div data-testid="desktop">
            <PostDetailCommentComposer />
          </div>
          <div data-testid="mobile">
            <PostDetailCommentComposer />
          </div>
        </PostDetailReactionsProvider>
      );
    }

    render(<TwoInstancesUnderOneProvider />);

    const [desktopTextarea, mobileTextarea] = screen.getAllByPlaceholderText('댓글 달기... (Enter 전송 / Shift+Enter 줄바꿈)');

    fireEvent.change(desktopTextarea!, { target: { value: '데스크탑에서 입력' } });

    expect(desktopTextarea).toHaveValue('데스크탑에서 입력');
    expect(mobileTextarea).toHaveValue('데스크탑에서 입력');
  });
});
