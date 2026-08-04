import { render, screen, fireEvent } from '@testing-library/react';

import PostDetailCommentComposer from './PostDetailCommentComposer';

const baseProps = {
  isAuthenticated: true,
  isSubmitting: false,
  value: '',
  onChange: jest.fn(),
  onSubmit: jest.fn(),
};

describe('PostDetailCommentComposer', () => {
  beforeEach(() => {
    baseProps.onChange = jest.fn();
    baseProps.onSubmit = jest.fn();
  });

  it('비로그인 상태면 로그인 안내 placeholder를 보여주고 입력창이 비활성화된다', () => {
    render(<PostDetailCommentComposer {...baseProps} isAuthenticated={false} />);

    const textarea = screen.getByPlaceholderText('로그인 후 댓글을 작성할 수 있어요.');
    expect(textarea).toBeDisabled();
  });

  it('입력값이 바뀌면 onChange가 호출된다', () => {
    render(<PostDetailCommentComposer {...baseProps} />);

    const textarea = screen.getByPlaceholderText('댓글 달기... (Enter 전송 / Shift+Enter 줄바꿈)');
    fireEvent.change(textarea, { target: { value: '새 댓글' } });

    expect(baseProps.onChange).toHaveBeenCalledWith('새 댓글');
  });

  it('빈 값이면 전송 버튼이 비활성화된다', () => {
    render(<PostDetailCommentComposer {...baseProps} value="" />);
    expect(screen.getByTitle('전송')).toBeDisabled();
  });

  it('값이 있으면 전송 버튼이 활성화되고, 클릭하면 onSubmit이 호출된다', () => {
    render(<PostDetailCommentComposer {...baseProps} value="댓글 내용" />);

    const submitButton = screen.getByTitle('전송');
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);
    expect(baseProps.onSubmit).toHaveBeenCalledTimes(1);
  });

  it('제출 중이면 전송 버튼이 비활성화된다', () => {
    render(<PostDetailCommentComposer {...baseProps} value="댓글 내용" isSubmitting />);
    expect(screen.getByTitle('전송')).toBeDisabled();
  });

  it('Enter 키를 누르면 onSubmit이 호출된다', () => {
    render(<PostDetailCommentComposer {...baseProps} value="댓글 내용" />);

    const textarea = screen.getByPlaceholderText('댓글 달기... (Enter 전송 / Shift+Enter 줄바꿈)');
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(baseProps.onSubmit).toHaveBeenCalledTimes(1);
  });

  it('Shift+Enter를 누르면 onSubmit이 호출되지 않는다', () => {
    render(<PostDetailCommentComposer {...baseProps} value="댓글 내용" />);

    const textarea = screen.getByPlaceholderText('댓글 달기... (Enter 전송 / Shift+Enter 줄바꿈)');
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    expect(baseProps.onSubmit).not.toHaveBeenCalled();
  });
});
