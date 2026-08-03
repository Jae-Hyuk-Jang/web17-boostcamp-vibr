'use client';

import { useEffect, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInfiniteScrollTrigger } from '@/hooks';
import { getFeedPosts } from '@/api';
import { FeedSkeleton } from '../skeleton';
import LoadingSpinner from '../ui/LoadingSpinner';
import FeedList from './FeedList';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { PostResponseDto as Post, Cursor } from '@repo/dto';

interface FeedViewProps {
  initialPost?: Post;
}

export type FeedPage = {
  posts: Post[];
  hasNext: boolean;
  nextCursor?: Cursor;
};

export const feedQueryKey = ['feed'] as const;

/** postId 기반 게시글 목록 중복 제거 함수 */
const dedupePosts = (posts: Post[]) => Array.from(new Map(posts.map((post) => [post.id, post])).values());

export default function FeedView({ initialPost }: FeedViewProps) {
  const openModal = useModalStore((s) => s.openModal);

  useEffect(() => {
    if (initialPost) {
      openModal(MODAL_TYPES.POST_DETAIL, { postId: initialPost.id, initialPost });
    }
  }, [initialPost, openModal]);

  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: feedQueryKey,
    queryFn: async ({ pageParam }: { pageParam: Cursor | undefined }): Promise<FeedPage> => {
      if (pageParam !== undefined) await new Promise((resolve) => setTimeout(resolve, 300)); // 로딩 스피너 짧게 노출(기존 useInfiniteScroll 동작 유지)
      return getFeedPosts(pageParam);
    },
    initialPageParam: undefined as Cursor | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
  });

  const ref = useInfiniteScrollTrigger({
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    fetchNextPage: () => {
      void fetchNextPage();
    },
  });

  // 공유 라우트로 진입한 특정 글을 목록 맨 앞에 시딩 — 실제 피드 페이지에도 같은 글이 있으면 dedupe로 하나만 남는다.
  const posts = useMemo(() => {
    const fetched = data?.pages.flatMap((p) => p.posts) ?? [];
    return dedupePosts(initialPost ? [initialPost, ...fetched] : fetched);
  }, [data, initialPost]);

  const isInitialLoading = isPending;
  const errorMsg = isError ? '오류가 발생했습니다.' : null;
  const hasNext = Boolean(hasNextPage);

  if (isInitialLoading && !initialPost) return <FeedSkeleton />;

  return (
    <>
      <FeedList posts={posts} />
      {errorMsg && (
        <div className="text-center">
          <p>{errorMsg}</p>
          <p className="text-sm mt-2">다시 시도해주세요.</p>
        </div>
      )}
      {hasNext && (
        <div ref={ref}>
          <LoadingSpinner hStyle="py-6" />
        </div>
      )}
    </>
  );
}
