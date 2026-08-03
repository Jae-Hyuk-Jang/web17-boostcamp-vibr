'use client';

import { useCallback, useEffect } from 'react';
import { useInfiniteScroll } from '@/hooks';
import { getFeedPosts } from '@/api';
import { FeedSkeleton } from '../skeleton';
import LoadingSpinner from '../ui/LoadingSpinner';
import FeedList from './FeedList';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';

import { useFeedRefreshStore, usePostReactionOverridesStore } from '@/stores';
import { PostResponseDto as Post, Cursor } from '@repo/dto';

interface FeedViewProps {
  initialPost?: Post;
}

/** postId 기반 게시글 목록 중복 제거 함수 */
const dedupePosts = (posts: Post[]) => Array.from(new Map(posts.map((post) => [post.id, post])).values());

export default function FeedView({ initialPost }: FeedViewProps) {
  const openModal = useModalStore((s) => s.openModal);
  const nonce = useFeedRefreshStore((s) => s.nonce);

  useEffect(() => {
    if (initialPost) {
      openModal(MODAL_TYPES.POST_DETAIL, { postId: initialPost.id, initialPost });
    }
  }, [initialPost, openModal]);

  const fetchFn = useCallback(async (cursor?: Cursor, limit?: number) => {
    const data = await getFeedPosts(cursor, limit);
    return { items: data.posts, hasNext: data.hasNext, nextCursor: data.nextCursor };
  }, []);

  const {
    items: posts,
    setItems: setPosts,
    hasNext,
    isInitialLoading,
    errorMsg,
    ref,
  } = useInfiniteScroll<Post, Cursor>({
    fetchFn,
    resetKey: String(nonce),
    initialItems: initialPost ? [initialPost] : [],
    mergeItems: (prev, next) => dedupePosts([...prev, ...next]),
  });

  const deletedPostId = usePostReactionOverridesStore((s) => s.deletedPostId);
  const clearDeletedPostId = usePostReactionOverridesStore((s) => s.clearDeletedPostId);

  const updateDeletedPost = useCallback(
    (deletedPostId: string) => {
      setPosts((prev) => prev.filter((post) => post.id !== deletedPostId));
    },
    [setPosts],
  );

  useEffect(() => {
    if (!deletedPostId) return;
    updateDeletedPost(deletedPostId);
    clearDeletedPostId();
  }, [deletedPostId, updateDeletedPost, clearDeletedPostId]);

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
