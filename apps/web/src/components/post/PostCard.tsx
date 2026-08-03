'use client';

import { useCallback, useMemo } from 'react';

import { PostHeader, PostMedia, PostActions, PostContentPreview } from './index';
import type { MusicResponseDto as Music, PostResponseDto as Post } from '@repo/dto';

import { usePostLikeToggle, usePostCacheSync } from '@/hooks';
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

  // postDetailQueryKey 캐시를 구독한다 — usePostLikeToggle/usePostReactions/usePostDetailModal가
  // 이 캐시에 좋아요/댓글수/본문을 쓰면 그 값을 그대로 반영한다(usePostReactionOverridesStore 대체).
  const { post: cachedPost } = usePostCacheSync(post.id, post);

  const {
    isLiked: isOptimisticLiked,
    likeCount: optimisticLikeCount,
    isSubmitting: isLikeSubmitting,
    toggleLike: handleToggleLike,
  } = usePostLikeToggle({
    postId: post.id,
    initialIsLiked: Boolean(cachedPost.isLiked),
    initialLikeCount: cachedPost.likeCount,
    isAuthenticated,
    // 캐시 반영 값(예: 상세 모달에서 눌러서 캐시가 바뀜) 변경 시 로컬 optimistic을 곧바로
    // 동기화하는 기존 동작을 그대로 보존한다 — 캐시를 직접 구독하는 소비처의 기존 관례.
    resetSubmittingOnSync: true,
  });

  const isOwner = post.author.id === userId;

  const postForActions: Post = useMemo(
    () => ({
      ...cachedPost,
      isLiked: isOptimisticLiked,
      likeCount: optimisticLikeCount,
    }),
    [cachedPost, isOptimisticLiked, optimisticLikeCount],
  );

  const handleOpenDetail = useCallback(() => onOpenDetail(postForActions), [onOpenDetail, postForActions]);

  const openEditPostModal = useCallback(() => {
    openModal(MODAL_TYPES.POST_DETAIL, { postId: post.id, initialIsEditing: true, initialEditingContent: cachedPost.content });
  }, [openModal, post.id, cachedPost.content]);

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

        <PostContentPreview content={cachedPost.content} onClickMore={handleOpenDetail} />
      </div>
    </article>
  );
}
