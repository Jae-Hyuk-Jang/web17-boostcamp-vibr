'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { PostResponseDto as Post } from '@repo/dto';
import { getPostDetail } from '@/api/internal/post';
import { postDetailQueryKey } from '@/query-keys';

type Params = {
  enabled: boolean;
  postId?: string;
  passedPost?: Post;
};

type Result = {
  post: Post | null;
  isLoading: boolean;
  error: string | null;
  updatePostContent: (newContent: string) => void;
};

// 게시글 상세 데이터는 세션 중 잦은 재편집 대상이 아니므로, 같은 postId를 다른 진입점(모달/편집 등)에서
// 다시 열어도 이 시간 내에는 캐시를 그대로 재사용한다(불필요한 재요청 방지).
export const POST_DETAIL_STALE_TIME_MS = 60 * 1000;

export function usePostDetail({ enabled, postId, passedPost }: Params): Result {
  const queryClient = useQueryClient();

  const matchedPost = postId && passedPost && passedPost.id === postId ? passedPost : undefined;

  const {
    data,
    isPending,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: postDetailQueryKey(postId ?? ''),
    queryFn: () => getPostDetail(postId as string),
    // passedPost가 이미 일치하면 fetch 자체를 건너뛴다(initialData는 fetch 없이도 캐시를 시딩함).
    enabled: enabled && Boolean(postId) && !matchedPost,
    initialData: matchedPost,
    staleTime: POST_DETAIL_STALE_TIME_MS,
  });

  const post = enabled && postId ? (data ?? null) : null;
  const isLoading = enabled && Boolean(postId) && !matchedPost && isPending;
  const error = !enabled
    ? null
    : !postId
      ? 'postId is missing'
      : isError
        ? queryError instanceof Error
          ? queryError.message
          : 'failed to fetch post detail'
        : null;

  const updatePostContent = (newContent: string) => {
    if (!postId) return;
    queryClient.setQueryData(postDetailQueryKey(postId), (prev: Post | undefined) => (prev ? { ...prev, content: newContent } : prev));
  };

  return { post, isLoading, error, updatePostContent };
}
