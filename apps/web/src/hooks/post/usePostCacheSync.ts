'use client';

import { useQuery } from '@tanstack/react-query';
import type { PostResponseDto as Post } from '@repo/dto';

import { getPostDetail } from '@/api/internal/post';
import { POST_DETAIL_STALE_TIME_MS } from './usePostDetail';
import { postDetailQueryKey } from '@/query-keys';

type Result = {
  post: Post;
};

/**
 * 목록 항목(피드 카드 등)이 상세보기(usePostDetail)와 같은 postId별 쿼리 캐시를
 * "구독만" 하기 위한 경량 훅. enabled:false라 자체 fetch는 절대 하지 않고,
 * passedPost를 initialData로 시딩해 다른 곳(usePostLikeToggle 등)이
 * queryClient.setQueryData로 같은 캐시를 갱신하면 그 값을 그대로 반영한다.
 */
export function usePostCacheSync(postId: string, passedPost: Post): Result {
  const { data } = useQuery({
    queryKey: postDetailQueryKey(postId),
    queryFn: () => getPostDetail(postId),
    enabled: false,
    initialData: passedPost,
    staleTime: POST_DETAIL_STALE_TIME_MS,
  });

  return { post: data ?? passedPost };
}
