'use client';

import type { RefObject, TouchEvent } from 'react';

import ModalCloseButton from '@/components/ui/ModalCloseButton';

import PostDetailBody from './PostDetailBody';
import PostDetailCommentComposer from './PostDetailCommentComposer';

interface PostCardDetailModalMobileSheetProps {
  /** 작성자 닉네임 — Post 전체가 아니라 실제로 쓰는 필드만 받는다 */
  nickname: string;
  content: string;
  profileImg: string;
  onClose: () => void;
  sheetRef: RefObject<HTMLElement>;
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: () => void;
}

export default function PostCardDetailModalMobileSheet({
  nickname,
  content,
  profileImg,
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
        <PostDetailBody profileImg={profileImg} nickname={nickname} content={content} />

        {/* 댓글 입력 */}
        <PostDetailCommentComposer />
      </section>
    </div>
  );
}
