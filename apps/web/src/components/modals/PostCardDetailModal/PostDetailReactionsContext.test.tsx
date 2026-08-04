import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import { PostDetailReactionsProvider, usePostDetailReactionsContext } from './PostDetailReactionsContext';
import type { UsePostDetailModalResult } from '@/hooks/post/usePostDetailModal';

const mockReactions = {
  isAuthenticated: true,
  isLiked: false,
  likeCount: 1,
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
} satisfies UsePostDetailModalResult['reactions'];

describe('PostDetailReactionsContext', () => {
  it('Provider 안에서는 제공된 value를 그대로 반환한다', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <PostDetailReactionsProvider value={mockReactions}>{children}</PostDetailReactionsProvider>
    );

    const { result } = renderHook(() => usePostDetailReactionsContext(), { wrapper });

    expect(result.current).toBe(mockReactions);
  });

  it('Provider 밖에서 호출하면 에러를 던진다', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => usePostDetailReactionsContext())).toThrow(
      'usePostDetailReactionsContext must be used within PostDetailReactionsProvider',
    );

    consoleError.mockRestore();
  });
});
