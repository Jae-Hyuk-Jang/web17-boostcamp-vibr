import { create } from 'zustand';

type State = {
  deletedPostId: string | null;

  setDeletedPostId: (postId: string) => void;
  clearDeletedPostId: () => void;
};

/**
 * 게시글 삭제를 목록 보유 컴포넌트(FeedView 등)에 알리는 신호 전용 스토어.
 * 좋아요/댓글수/본문 값 동기화는 postDetailQueryKey 쿼리 캐시로 이관됐다
 * (usePostCacheSync/usePostLikeToggle/usePostReactions/usePostDetailModal 참고) —
 * 이 스토어는 "목록에서 이 postId를 제거하라"는 이벤트성 신호만 남아있다.
 */
export const usePostDeletionSignalStore = create<State>((set) => ({
  deletedPostId: null,

  setDeletedPostId: (postId) => set({ deletedPostId: postId }),
  clearDeletedPostId: () => set({ deletedPostId: null }),
}));
