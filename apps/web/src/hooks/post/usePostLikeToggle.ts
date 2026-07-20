'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { addLike, removeLike } from '@/api/internal';
import { usePostReactionOverridesStore } from '@/stores/usePostReactionOverridesStore';

type Options = {
  postId: string;
  initialIsLiked: boolean;
  initialLikeCount: number;
  isAuthenticated: boolean;
  /**
   * true면 postId가 그대로인 채 override/서버값만 바뀌어도 isSubmitting을 리셋한다(PostCard.tsx의
   * 기존 동작 — 연타 시 토글→역토글로 이어질 수 있음, docs/refactors/post-reaction-state/regression-plan.md
   * 참고). false면 그 경우엔 isSubmitting을 건드리지 않는다(usePostReactions.ts의 기존 동작 — 진행 중
   * 재호출이 더 견고하게 막힘). 두 소비처의 기존 동작 차이를 그대로 보존하기 위한 옵션이며, 새로 도입한
   * 정책이 아니다. postId 자체가 바뀔 때는 이 값과 무관하게 항상 리셋한다(다른 게시글로 전환됐으니
   * 이전 요청의 진행 상태를 붙들고 있을 이유가 없음 — 두 소비처 모두의 기존 동작).
   */
  resetSubmittingOnSync: boolean;
};

type Result = {
  isLiked: boolean;
  likeCount: number;
  isSubmitting: boolean;
  toggleLike: () => Promise<void>;
};

export default function usePostLikeToggle({ postId, initialIsLiked, initialLikeCount, isAuthenticated, resetSubmittingOnSync }: Options): Result {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const prevPostIdRef = useRef(postId);

  useEffect(() => {
    const isPostIdChange = prevPostIdRef.current !== postId;
    prevPostIdRef.current = postId;

    setIsLiked(initialIsLiked);
    setLikeCount(initialLikeCount);
    if (isPostIdChange || resetSubmittingOnSync) setIsSubmitting(false);
  }, [postId, initialIsLiked, initialLikeCount, resetSubmittingOnSync]);

  const toggleLike = useCallback(async () => {
    if (!isAuthenticated) return;
    if (isSubmitting) return;

    const isPrevLiked = isLiked;
    const prevCount = likeCount;

    const isNextLiked = !isPrevLiked;
    const nextCount = prevCount + (isNextLiked ? 1 : -1);

    setIsSubmitting(true);
    setIsLiked(isNextLiked);
    setLikeCount(nextCount);
    usePostReactionOverridesStore.getState().setLikeOverride(postId, { isLiked: isNextLiked, likeCount: nextCount });

    try {
      if (isNextLiked) await addLike({ postId });
      else await removeLike(postId);
    } catch {
      setIsLiked(isPrevLiked);
      setLikeCount(prevCount);
      usePostReactionOverridesStore.getState().setLikeOverride(postId, { isLiked: isPrevLiked, likeCount: prevCount });
    } finally {
      setIsSubmitting(false);
    }
  }, [isAuthenticated, isSubmitting, isLiked, likeCount, postId]);

  return { isLiked, likeCount, isSubmitting, toggleLike };
}
