'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { PostHeader, PostMedia, PostActions, PostContentPreview } from './index';
import type { MusicResponseDto as Music, PostResponseDto as Post } from '@repo/dto';

import { addLike, removeLike } from '@/api';
import { usePostReactionOverridesStore } from '@/stores/usePostReactionOverridesStore';
import { useModalStore, useAuthStore, MODAL_TYPES } from '@/stores';

interface PostCardProps {
  post: Post;

  currentMusicId: string | null;
  isPlayingGlobal: boolean;

  onPlay: (music: Music) => void;
  onPlayAll?: () => void;
  onUserClick: (userId: string) => void;
  onOpenDetail: (post: Post) => void;
}

export default function PostCard({ post, currentMusicId, isPlayingGlobal, onPlay, onPlayAll, onUserClick, onOpenDetail }: PostCardProps) {
  const userId = useAuthStore((s) => s.userId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { openModal } = useModalStore();

  const likeOverride = usePostReactionOverridesStore((s) => s.likesByPostId[post.id]);
  const setLikeOverride = usePostReactionOverridesStore((s) => s.setLikeOverride);

  // 댓글 카운트 override 추가
  const commentOverride = usePostReactionOverridesStore((s) => s.commentsByPostId[post.id]);
  const baseCommentCount = commentOverride?.commentCount ?? post.commentCount;

  const isBaseLiked = Boolean(likeOverride?.isLiked ?? post.isLiked);
  const baseLikeCount = likeOverride?.likeCount ?? post.likeCount;

  const [isOptimisticLiked, setIsOptimisticLiked] = useState(isBaseLiked);
  const [optimisticLikeCount, setOptimisticLikeCount] = useState(baseLikeCount);
  const [isLikeSubmitting, setIsLikeSubmitting] = useState(false);
  const isOwner = post.author.id === userId;

  const postForActions: Post = useMemo(
    () => ({
      ...post,
      isLiked: isOptimisticLiked,
      likeCount: optimisticLikeCount,
      // 댓글 카운트도 store 반영값 사용
      commentCount: baseCommentCount,
    }),
    [post, isOptimisticLiked, optimisticLikeCount, baseCommentCount],
  );

  /**
   * 핵심: override/서버값 변경 시 로컬 optimistic도 동기화
   * - Detail에서 눌러서 store가 바뀌어도 카드가 즉시 따라감
   */
  useEffect(() => {
    setIsOptimisticLiked(isBaseLiked);
    setOptimisticLikeCount(baseLikeCount);
    setIsLikeSubmitting(false);
  }, [post.id, isBaseLiked, baseLikeCount]);

  const handleOpenDetail = useCallback(() => onOpenDetail(postForActions), [onOpenDetail, postForActions]);

  const handleToggleLike = useCallback(async () => {
    if (!isAuthenticated) return;
    if (isLikeSubmitting) return;

    const isPrevLiked = isOptimisticLiked;
    const prevCount = optimisticLikeCount;

    const isNextLiked = !isPrevLiked;
    const nextCount = prevCount + (isNextLiked ? 1 : -1);

    setIsLikeSubmitting(true);

    // optimistic (로컬)
    setIsOptimisticLiked(isNextLiked);
    setOptimisticLikeCount(nextCount);

    // optimistic (전역)
    setLikeOverride(post.id, { isLiked: isNextLiked, likeCount: nextCount });

    try {
      if (isNextLiked) await addLike({ postId: post.id });
      else await removeLike(post.id);
    } catch {
      // rollback
      setIsOptimisticLiked(isPrevLiked);
      setOptimisticLikeCount(prevCount);
      setLikeOverride(post.id, { isLiked: isPrevLiked, likeCount: prevCount });
    } finally {
      setIsLikeSubmitting(false);
    }
  }, [isAuthenticated, isLikeSubmitting, isOptimisticLiked, optimisticLikeCount, post.id, setLikeOverride]);

  const openEditPostModal = useCallback(() => {
    openModal(MODAL_TYPES.POST_DETAIL, { postId: post.id, initialIsEditing: true, initialEditingContent: post.content });
  }, [openModal, post.id, post.content]);

  return (
    <article onClick={handleOpenDetail} className="bg-white py-6 cursor-pointer">
      {/* 이미지 제외한 텍스트 섹션은 개별 패딩 적용 */}
      <div className="px-4 sm:px-6">
        <PostHeader post={post} isOwner={isOwner} onUserClick={onUserClick} onEditPost={isOwner ? openEditPostModal : undefined} />
      </div>

      <div className="xs:px-4 sm:px-6">
        <PostMedia
          post={post}
          variant="card"
          currentMusicId={currentMusicId}
          isPlayingGlobal={isPlayingGlobal}
          onPlay={onPlay}
          onPlayAll={onPlayAll}
          onClickContainer={handleOpenDetail}
        />
      </div>

      <div className="px-4 sm:px-6">
        <PostActions
          post={postForActions}
          onClickLike={handleToggleLike}
          onClickComment={handleOpenDetail}
          disabledLike={!isAuthenticated || isLikeSubmitting}
        />

        <PostContentPreview content={post.content} onClickMore={handleOpenDetail} />
      </div>
    </article>
  );
}
