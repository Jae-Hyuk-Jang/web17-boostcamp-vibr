'use client';

import { PostHeader } from '../../post';
import { useSwipeToDismiss } from '@/hooks';
import { usePostDetailModal } from '@/hooks/post/usePostDetailModal';

import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { PostMedia } from '@/components/post';
import ModalShell from '@/components/ui/ModalShell';
import ModalCloseButton from '@/components/ui/ModalCloseButton';

import { PostDetailBody, PostDetailActions, PostDetailCommentComposer, PostDetailEditForm, LikedUsersOverlay } from './partials';

export const PostCardDetailModal = () => {
  const {
    isEnabled,
    postId,
    safePost,
    isLoading,
    error,
    isOwner,
    profileImg,
    reactions,
    likedUsers,
    editing,
    player,
    handleClose,
    closeModal,
    handleUserClick,
  } = usePostDetailModal();

  const { sheetRef, handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeToDismiss(handleClose);

  if (!isEnabled || !postId) return null;

  return (
    <>
      {/* ── 모바일: 댓글 바텀시트 ── */}
      <div className="lg:hidden">
        <div className="fixed inset-0 z-[10001] bg-black/60 backdrop-blur-sm animate-fade-in" onClick={handleClose} />

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
              <ModalCloseButton
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-gray-4 text-primary transition-colors"
                iconClassName="w-5 h-5"
              />
            </div>
          </div>

          {/* 댓글 목록 */}
          <PostDetailBody
            profileImg={profileImg}
            nickname={safePost.author.nickname}
            content={safePost.content}
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

      {/* ── 데스크탑: 기존 풀 모달 ── */}
      <ModalShell
        onClose={handleClose}
        ariaLabel="게시글 상세"
        className="hidden lg:flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      >
        <div className="bg-white w-full max-w-5xl h-full max-h-[85vh] rounded-2xl border-2 border-primary shadow-2xl flex flex-col md:flex-row overflow-hidden animate-scale-up">
          {isLoading ? (
            <LoadingSpinner />
          ) : error ? (
            <div className="flex-1 flex items-center justify-center bg-gray-4">
              <div className="text-sm font-bold text-gray-500">{error}</div>
            </div>
          ) : (
            <PostMedia
              post={safePost}
              variant="modal"
              currentMusicId={player.currentMusicId}
              isPlayingGlobal={player.isPlaying}
              onPlay={player.handlePlayFromPost}
              onPlayAll={player.handlePlayAll}
            />
          )}

          <div className="w-full md:w-105 flex flex-col bg-white border-l-2 border-primary flex-1 min-h-0">
            <div className="mt-4 px-4 py-2 border-b-2 border-primary/10">
              <PostHeader
                post={safePost}
                isOwner={isOwner}
                onUserClick={() => handleUserClick(safePost.author.id)}
                onEditPost={isOwner ? () => editing.startEdit(safePost.content) : undefined}
                onDeletePost={isOwner ? closeModal : undefined}
              />
            </div>

            {editing.isEditing ? (
              <PostDetailEditForm
                value={editing.draft ?? ''}
                isSaving={editing.isSaving}
                isNoOpChange={editing.draft === safePost.content}
                onChange={(next) => editing.setDraft(next)}
                onSave={() => editing.commit()}
                onCancel={() => editing.cancel()}
              />
            ) : (
              <PostDetailBody
                profileImg={profileImg}
                nickname={safePost.author.nickname}
                content={safePost.content}
                comments={reactions.comments}
                commentsLoading={reactions.isCommentsLoading}
              />
            )}

            <PostDetailActions
              isAuthenticated={reactions.isAuthenticated}
              isSubmitting={reactions.isSubmittingLike}
              isLiked={reactions.isLiked}
              likeCount={reactions.likeCount}
              postId={postId}
              onToggleLike={() => reactions.toggleLike()}
              onOpenLikedUsers={() => likedUsers.open()}
            />
            <PostDetailCommentComposer
              isAuthenticated={reactions.isAuthenticated}
              isSubmitting={reactions.isSubmittingComment}
              value={reactions.commentText}
              onChange={(v) => reactions.setCommentText(v)}
              onSubmit={() => reactions.submitComment()}
            />
          </div>
        </div>
      </ModalShell>

      <LikedUsersOverlay
        isOpen={likedUsers.isOpen}
        onClose={() => likedUsers.close()}
        users={likedUsers.users}
        isLoading={likedUsers.isLoading}
        errorMsg={likedUsers.errorMsg}
        onRetry={() => likedUsers.refetch()}
      />
    </>
  );
};
