import { render, screen } from '@testing-library/react';
import type { GetCommentsResDto } from '@repo/dto';

import PostDetailBody from './PostDetailBody';

type CommentItem = GetCommentsResDto['comments'][number];

const mockComment = (overrides: Partial<CommentItem> = {}): CommentItem => ({
  id: 'comment-1',
  content: '댓글 내용',
  createdAt: '2026-08-04T00:00:00.000Z',
  author: { id: 'user-1', nickname: '댓글작성자', profileImgUrl: null },
  ...overrides,
});

const baseProps = {
  profileImg: '/profile.png',
  nickname: '작성자',
  content: '게시글 본문',
  comments: [] as CommentItem[],
  commentsLoading: false,
};

describe('PostDetailBody', () => {
  it('hideAuthorRow가 없으면 작성자 정보와 본문을 렌더링한다', () => {
    render(<PostDetailBody {...baseProps} />);

    expect(screen.getByText('작성자')).toBeInTheDocument();
    expect(screen.getByText('게시글 본문')).toBeInTheDocument();
  });

  it('hideAuthorRow가 true면 작성자 정보와 본문을 렌더링하지 않는다', () => {
    render(<PostDetailBody {...baseProps} hideAuthorRow />);

    expect(screen.queryByText('작성자')).not.toBeInTheDocument();
    expect(screen.queryByText('게시글 본문')).not.toBeInTheDocument();
  });

  it('commentsLoading이 true면 로딩 스피너를 보여주고 댓글 목록/빈 상태 메시지는 렌더링하지 않는다', () => {
    render(<PostDetailBody {...baseProps} commentsLoading comments={[mockComment()]} />);

    expect(screen.queryByText('댓글 내용')).not.toBeInTheDocument();
    expect(screen.queryByText('아직 댓글이 없습니다.')).not.toBeInTheDocument();
  });

  it('댓글이 없고 로딩 중이 아니면 빈 상태 메시지를 보여준다', () => {
    render(<PostDetailBody {...baseProps} comments={[]} commentsLoading={false} />);

    expect(screen.getByText('아직 댓글이 없습니다.')).toBeInTheDocument();
  });

  it('댓글이 있으면 목록을 렌더링한다', () => {
    render(
      <PostDetailBody
        {...baseProps}
        comments={[mockComment({ id: 'c1', content: '첫 댓글' }), mockComment({ id: 'c2', content: '두 번째 댓글' })]}
      />,
    );

    expect(screen.getByText('첫 댓글')).toBeInTheDocument();
    expect(screen.getByText('두 번째 댓글')).toBeInTheDocument();
    expect(screen.queryByText('아직 댓글이 없습니다.')).not.toBeInTheDocument();
  });
});
