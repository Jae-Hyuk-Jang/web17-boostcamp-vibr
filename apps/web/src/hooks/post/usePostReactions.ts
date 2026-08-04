'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GetCommentsResDto, PostResponseDto as Post, UserDto } from '@repo/dto';

import { getComments, createComment } from '@/api/internal';
import { useAuthMeQuery } from '@/hooks/auth/client/useAuthMeQuery';
import usePostLikeToggle from './usePostLikeToggle';
import { postDetailQueryKey, commentsQueryKey } from '@/query-keys';

type CommentItem = GetCommentsResDto['comments'][number];

type Options = {
  enabled: boolean;
  postId: string;

  initialIsLiked: boolean;
  initialLikeCount: number;

  /** 기본 5000ms */
  pollMs?: number;
};

type Result = {
  isAuthenticated: boolean;

  isLiked: boolean;
  likeCount: number;
  toggleLike: () => Promise<void>;
  isSubmittingLike: boolean;

  comments: CommentItem[];
  isCommentsLoading: boolean;

  commentText: string;
  setCommentText: (v: string) => void;
  submitComment: () => Promise<void>;
  isSubmittingComment: boolean;

  commentCount: number;

  refetchComments: () => Promise<void>;
};

const nowIso = () => new Date().toISOString();

const safeComments = (v: unknown): CommentItem[] => {
  if (!v || typeof v !== 'object') return [];
  const list = (v as { comments?: unknown }).comments;
  if (!Array.isArray(list)) return [];
  return list as CommentItem[];
};

export const getEffectivePollMs = (base: number) => {
  const isHidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
  if (isHidden) return Math.max(base * 6, 30000);
  return base;
};

export default function usePostReactions({ enabled, postId, initialIsLiked, initialLikeCount, pollMs = 5000 }: Options): Result {
  const queryClient = useQueryClient();
  const { data: me, isSuccess: isAuthenticated } = useAuthMeQuery(enabled);

  const {
    isLiked,
    likeCount,
    isSubmitting: isSubmittingLike,
    toggleLike,
  } = usePostLikeToggle({
    postId,
    initialIsLiked,
    initialLikeCount,
    isAuthenticated,
    // 이 훅(usePostReactions)은 override 변경만으로는 isSubmittingLike를 리셋하지 않는 기존 동작을
    // 유지한다 — postId가 실제로 바뀔 때만 리셋된다(usePostLikeToggle 내부에서 항상 처리).
    resetSubmittingOnSync: false,
  });

  const [commentText, setCommentText] = useState('');

  const meRef = useRef<UserDto | null>(null);
  useEffect(() => {
    meRef.current = me ?? null;
  }, [me]);

  // postId가 바뀔 때 이전 게시글에서 입력하던 텍스트가 남지 않도록 리셋
  useEffect(() => {
    setCommentText('');
  }, [postId]);

  const setGlobalCommentCount = useCallback(
    (count: number) => {
      queryClient.setQueryData(postDetailQueryKey(postId), (prev: Post | undefined) => (prev ? { ...prev, commentCount: count } : prev));
    },
    [queryClient, postId],
  );

  const createCommentMutation = useMutation({
    mutationFn: (content: string) => createComment({ postId, content }),
    onMutate: async (content: string) => {
      // 진행 중인 폴링 요청이 낙관적 추가분을 덮어쓰지 않도록 취소
      await queryClient.cancelQueries({ queryKey: commentsQueryKey(postId) });

      const tmpId = `tmp-${Date.now()}`;

      if (meRef.current) {
        const optimistic: CommentItem = { id: tmpId, content, createdAt: nowIso(), author: meRef.current };
        queryClient.setQueryData<CommentItem[]>(commentsQueryKey(postId), (old = []) => [...old, optimistic]);
      }

      return { tmpId };
    },
    onSuccess: (res, _content, context) => {
      // tmp id -> 서버 id로 캐시 내 치환만 한다 — 여기서 refetch를 다시 부르지 않는 것이
      // "방금 쓴 댓글이 사라지는" #39 race를 구조적으로 없앤다.
      queryClient.setQueryData<CommentItem[]>(commentsQueryKey(postId), (old = []) =>
        old.map((c) => (c.id === context?.tmpId ? { ...c, id: res.id } : c)),
      );
    },
    onError: (_err, _content, context) => {
      // snapshot 전체를 되돌리는 대신, 실패한 낙관적 항목만 제거한다.
      queryClient.setQueryData<CommentItem[]>(commentsQueryKey(postId), (old = []) => old.filter((c) => c.id !== context?.tmpId));
    },
  });

  const { data: comments = [], isLoading: isCommentsLoading } = useQuery({
    queryKey: commentsQueryKey(postId),
    queryFn: async () => safeComments(await getComments(postId)),
    enabled,
    refetchInterval: () => {
      // 입력 중/전송 중이면 skip
      if (commentText.trim().length > 0 || createCommentMutation.isPending) return false;
      return getEffectivePollMs(pollMs);
    },
  });

  const commentCount = comments.length;

  useEffect(() => {
    setGlobalCommentCount(commentCount);
  }, [commentCount, setGlobalCommentCount]);

  const refetchComments = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: commentsQueryKey(postId) });
  }, [queryClient, postId]);

  const submitComment = useCallback(async () => {
    if (!isAuthenticated) return;
    if (createCommentMutation.isPending) return;

    const content = commentText.trim();
    if (!content) return;
    if (!meRef.current) return;

    setCommentText('');

    try {
      await createCommentMutation.mutateAsync(content);
    } catch {
      // onError가 이미 캐시를 롤백했으므로 추가 처리는 없다
    }
  }, [isAuthenticated, commentText, createCommentMutation]);

  return {
    isAuthenticated,

    isLiked,
    likeCount,
    toggleLike,
    isSubmittingLike,

    comments,
    isCommentsLoading,

    commentText,
    setCommentText,
    submitComment,
    isSubmittingComment: createCommentMutation.isPending,

    commentCount,
    refetchComments,
  };
}
