'use client';

import type { RefObject, TouchEvent } from 'react';
import type { PostResponseDto as Post } from '@repo/dto';

import ModalCloseButton from '@/components/ui/ModalCloseButton';
import type { UsePostDetailModalResult } from '@/hooks/post/usePostDetailModal';

import PostDetailBody from './PostDetailBody';
import PostDetailCommentComposer from './PostDetailCommentComposer';

type CommentReactions = Pick<
  UsePostDetailModalResult['reactions'],
  'comments' | 'isCommentsLoading' | 'isAuthenticated' | 'isSubmittingComment' | 'commentText' | 'setCommentText' | 'submitComment'
>;

interface PostCardDetailModalMobileSheetProps {
  post: Post;
  profileImg: string;
  /** 댓글 관련 필드만 쓴다 — 좋아요 관련 필드(isLiked 등)는 이 화면에서 쓰지 않아 타입에서 제외 */
  reactions: CommentReactions;
  onClose: () => void;
  sheetRef: RefObject<HTMLElement>;
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: () => void;
}

export default function PostCardDetailModalMobileSheet({
  post,
  profileImg,
  reactions,
  onClose,
  sheetRef,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: PostCardDetailModalMobileSheetProps) {
  return (
    <div className="lg:hidden">
      <div className="fixed inset-0 z-[10001] bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <section
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 z-[10002] h-[90vh] bg-white rounded-t-2xl border-t-2 border-x-2 border-primary flex flex-col animate-slide-up"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* 핸들 + 닫기 버튼 */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
          <div className="flex-1" />
          <div className="w-10 h-1 rounded-full bg-gray-3" />
          <div className="flex-1 flex justify-end">
            <ModalCloseButton onClick={onClose} className="p-2 rounded-full hover:bg-gray-4 text-primary transition-colors" iconClassName="w-5 h-5" />
          </div>
        </div>

        {/* 댓글 목록 */}
        <PostDetailBody
          profileImg={profileImg}
          nickname={post.author.nickname}
          content={post.content}
          comments={reactions.comments}
          commentsLoading={reactions.isCommentsLoading}
        />

        {/* 댓글 입력 */}
        <PostDetailCommentComposer
          isAuthenticated={reactions.isAuthenticated}
          isSubmitting={reactions.isSubmittingComment}
          value={reactions.commentText}
          onChange={(v) => reactions.setCommentText(v)}
          onSubmit={() => reactions.submitComment()}
        />
      </section>
    </div>
  );
}
