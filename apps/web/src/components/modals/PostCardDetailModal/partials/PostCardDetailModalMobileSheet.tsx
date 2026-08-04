'use client';

import ModalCloseButton from '@/components/ui/ModalCloseButton';
import { useSwipeToDismiss } from '@/hooks';

import { usePostDetailModalContext } from '../PostDetailModalContext';
import PostDetailBody from './PostDetailBody';
import PostDetailCommentComposer from './PostDetailCommentComposer';

export default function PostCardDetailModalMobileSheet() {
  const { safePost, profileImg, handleClose: onClose } = usePostDetailModalContext();
  const nickname = safePost.author.nickname;
  const content = safePost.content;

  // 스와이프다운 닫기 — 이 시트에서만 쓰이는 제스처라 여기서 직접 소유한다(부모가 대신 구독해 props로
  // 내려줄 이유가 없음, PlaybackProvider와 달리 여러 컴포넌트가 공유하는 값이 아니다).
  const { sheetRef, handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeToDismiss(onClose);

  return (
    <div className="lg:hidden">
      <div className="fixed inset-0 z-[10001] bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <section
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 z-[10002] h-[90vh] bg-white rounded-t-2xl border-t-2 border-x-2 border-primary flex flex-col animate-slide-up"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
