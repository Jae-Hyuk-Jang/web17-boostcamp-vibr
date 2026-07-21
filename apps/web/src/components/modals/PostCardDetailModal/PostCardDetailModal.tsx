'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { MusicResponseDto as Music, PostResponseDto as Post } from '@repo/dto';

import { useRouter, usePathname } from 'next/navigation';
import { PostHeader } from '../../post';
import { useModalStore, MODAL_TYPES, usePlayerStore, usePostReactionOverridesStore, useAuthStore } from '@/stores';
import useIsMobile from '@/hooks/useIsMobile';
import { useScrollLock, usePostDetail, useLikedUsers, usePostReactions, usePostDetailUxLog, useSwipeToDismiss } from '@/hooks';

import { EMPTY_POST, DEFAULT_IMAGES } from '@/constants';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { PostMedia } from '@/components/post';
import ModalShell from '@/components/ui/ModalShell';
import ModalCloseButton from '@/components/ui/ModalCloseButton';
import { coalesceImageSrc } from '@/utils';
import { toast } from 'react-toastify';
import { updatePost } from '@/api';

import { PostDetailBody, PostDetailActions, PostDetailCommentComposer, LikedUsersOverlay } from './partials';

export const PostCardDetailModal = () => {
  const userId = useAuthStore((s) => s.userId);
  const router = useRouter();
  const { isOpen, modalType, modalProps, closeModal } = useModalStore();
  const isEnabled = isOpen && modalType === MODAL_TYPES.POST_DETAIL;

  useScrollLock(isEnabled);

  const postId = isEnabled ? (modalProps?.postId as string | undefined) : undefined;
  const passedPost = isEnabled ? ((modalProps?.post as Post | undefined) ?? undefined) : undefined;

  useEffect(() => {
    if (!isEnabled) return;
    if (!postId) closeModal();
  }, [isEnabled, postId, closeModal]);

  const { post, isLoading, error, updatePostContent } = usePostDetail({ enabled: isEnabled, postId, passedPost });
  const isOwner = userId === post?.author.id;
  const safePost = post ?? passedPost ?? EMPTY_POST;

  const setContentOverride = usePostReactionOverridesStore((s) => s.setContentOverride);
  const likeOverride = usePostReactionOverridesStore((s) => (postId ? s.likesByPostId[postId] : undefined));

  const isLikedInitially = likeOverride?.isLiked ?? post?.isLiked ?? passedPost?.isLiked ?? false;
  const initialLikeCount = likeOverride?.likeCount ?? post?.likeCount ?? passedPost?.likeCount ?? 0;

  const reactions = usePostReactions({
    enabled: Boolean(isEnabled && postId),
    postId: postId ?? '',
    initialIsLiked: isLikedInitially,
    initialLikeCount,
  });

  const [isLikedUsersOpen, setIsLikedUsersOpen] = useState(false);
  useEffect(() => {
    if (!isEnabled) return;
    setIsLikedUsersOpen(false);
  }, [isEnabled, postId]);

  const likedUsers = useLikedUsers({
    enabled: Boolean(isEnabled && postId && isLikedUsersOpen),
    postId: postId ?? '',
  });

  const playMusic = usePlayerStore((s) => s.playMusic);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const selectMusic = usePlayerStore((s) => s.selectMusic);
  const currentMusicId = usePlayerStore((s) => s.currentMusic?.id ?? null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const profileImg = useMemo(() => coalesceImageSrc(safePost.author.profileImgUrl, DEFAULT_IMAGES.PROFILE), [safePost.author.profileImgUrl]);

  // 데스크탑 → 모바일 리사이즈 시, 프로필 페이지에서 열린 모달이면 posts 피드 페이지로 전환
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const isMobileInitializedRef = useRef(false);
  const prevIsMobileRef = useRef(false);
  useEffect(() => {
    if (!isMobileInitializedRef.current) {
      isMobileInitializedRef.current = true;
      prevIsMobileRef.current = isMobile;
      return;
    }
    const isPreviouslyMobile = prevIsMobileRef.current;
    prevIsMobileRef.current = isMobile;

    if (!isPreviouslyMobile && isMobile && isEnabled && postId) {
      const profileMatch = pathname.match(/^\/profile\/([^/]+)$/);
      if (profileMatch) {
        closeModal();
        router.push(`/profile/${profileMatch[1]}/posts?postId=${postId}`);
      }
    }
  }, [isMobile, isEnabled, pathname, postId, router, closeModal]);

  // 게시글 수정 관련 상태
  const [isEditing, setIsEditing] = useState(modalProps?.initialIsEditing === true);
  const [editedContent, setEditedContent] = useState((modalProps?.initialEditingContent as string | undefined) || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEdit = () => {
    setEditedContent(safePost.content);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!postId || isSaving || editedContent === safePost.content) return; // 내용 변경 없으면 저장 안 함

    setIsSaving(true);
    try {
      await updatePost(postId, { content: editedContent });
      toast.success('게시글을 수정했습니다.');
      setIsEditing(false);

      updatePostContent(editedContent); // 게시글 상세 데이터 갱신
      setContentOverride(postId, { content: editedContent }); // 피드 게시글 데이터 갱신 위한 상태 업데이트
    } catch (err) {
      toast.error('게시글 수정에 실패했습니다.');
      console.error('게시글 수정 실패:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(safePost.content); // 원본 content로 되돌리기
  };

  // UX 로그 수집(상세모달 체류 시간·재생한 곡 수·곡별 재생 시간, 중복 전송 방지)
  const postMusicIds = useMemo(() => safePost.musics.map((m) => m.id), [safePost.musics]);
  const { recordPlayedMusic, emit } = usePostDetailUxLog({
    enabled: isEnabled,
    postId,
    userId,
    isPlaying,
    currentMusicId,
    postMusicIds,
  });

  // 모달에서 재생 트리거(곡 id 기록)
  const handlePlayFromPost = useCallback(
    (m: Music) => {
      if (m?.id) recordPlayedMusic(m.id);
      playMusic(m);
    },
    [playMusic, recordPlayedMusic],
  );

  // 커버 페이지: 게시글 전체 음악을 큐에 넣고 첫 번째 곡 재생
  const handlePlayAll = useCallback(() => {
    const musics = safePost.musics;
    if (!musics.length) return;
    const firstMusic = musics[0];
    if (!firstMusic) return;
    addToQueue(musics);
    recordPlayedMusic(firstMusic.id);
    selectMusic(firstMusic);
  }, [safePost.musics, addToQueue, selectMusic, recordPlayedMusic]);

  const handleClose = useCallback(() => {
    emit();
    closeModal();
  }, [emit, closeModal]);

  // 모달 unmount/disable 시에도 summary 전송(백업) — 단, emit 내부의 emitOnce 가드라 중복 없음
  useEffect(() => {
    if (!isEnabled) return;
    return () => {
      emit();
    };
  }, [isEnabled, emit]);

  const { sheetRef, handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeToDismiss(handleClose);

  if (!isEnabled || !postId) return null;

  const handleUserClick = (targetUserId: string) => {
    router.push(`/profile/${targetUserId}`);
  };

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
              currentMusicId={currentMusicId}
              isPlayingGlobal={isPlaying}
              onPlay={handlePlayFromPost}
              onPlayAll={handlePlayAll}
            />
          )}

          <div className="w-full md:w-105 flex flex-col bg-white border-l-2 border-primary flex-1 min-h-0">
            <div className="mt-4 px-4 py-2 border-b-2 border-primary/10">
              <PostHeader
                post={safePost}
                isOwner={isOwner}
                onUserClick={() => handleUserClick(safePost.author.id)}
                onEditPost={isOwner ? handleStartEdit : undefined}
                onDeletePost={isOwner ? closeModal : undefined}
              />
            </div>

            {isEditing ? (
              <div className="flex-1 overflow-y-auto p-4">
                <textarea
                  className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-accent-cyan transition-all"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={10}
                />
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || editedContent === safePost.content}
                    className="px-4 py-2 text-sm font-bold text-white bg-accent-cyan rounded-lg hover:bg-cyan-500 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
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
              onOpenLikedUsers={() => setIsLikedUsersOpen(true)}
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
        isOpen={isLikedUsersOpen}
        onClose={() => setIsLikedUsersOpen(false)}
        users={likedUsers.users}
        isLoading={likedUsers.isLoading}
        errorMsg={likedUsers.errorMsg}
        onRetry={() => likedUsers.refetch()}
      />
    </>
  );
};
