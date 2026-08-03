'use client';

import { useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getUser, getUserProfilePosts } from '@/api';
import { useInfiniteScrollTrigger } from '@/hooks';
import { useAuthStore, useProfileStore } from '@/stores';
import type { PostPreviewDto as PostPreview } from '@repo/dto';
import { ProfileSkeleton } from '../skeleton';
import { ProfileInfo } from './ProfileInfo';
import ProfilePosts from './ProfilePosts';
import LoadingSpinner from '../ui/LoadingSpinner';

type Page = {
  items: PostPreview[];
  hasNext: boolean;
  nextCursor?: string;
};

export const profileGridQueryKey = (userId: string) => ['profileGrid', userId] as const;

export default function ProfileView({ userId }: { userId: string }) {
  const loggedInUserId = useAuthStore((s) => s.userId);
  const { profile, setProfile } = useProfileStore();

  const isMyProfile = loggedInUserId === userId;

  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: profileGridQueryKey(userId),
    queryFn: async ({ pageParam }: { pageParam: string | undefined }): Promise<Page> => {
      if (pageParam !== undefined) await new Promise((resolve) => setTimeout(resolve, 300)); // 로딩 스피너 짧게 노출
      return getUserProfilePosts(userId, pageParam);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
  });

  const ref = useInfiniteScrollTrigger({
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    fetchNextPage: () => {
      void fetchNextPage();
    },
  });

  const items = data?.pages.flatMap((p) => p.items) ?? [];
  const isInitialLoading = isPending;
  const errorMsg = isError ? '오류가 발생했습니다.' : null;
  const hasNext = Boolean(hasNextPage);

  const [renderError, setRenderError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const info = await getUser(userId);
        setProfile(info);
      } catch (err) {
        console.error('프로필 데이터 fetch 실패', err);
        if (err instanceof Error) {
          setRenderError(err);
        } else {
          setRenderError(new Error('프로필 로딩 중 에러가 발생했습니다.'));
        }
      }
    };

    fetchData();
  }, [userId, setProfile]);

  // 프로필 사용자 정보 렌더링 단계에서 발생하는 에러 throw (무한스크롤 에러는 throw 없이 메시지만 표시)
  if (renderError) throw renderError;

  // 최초 요청 처리 중이거나, 스토어의 프로필 id와 현재 페이지의 프로필 id가 다를 때 스켈레톤 표시
  if (isInitialLoading || profile?.id !== userId) return <ProfileSkeleton />;

  return (
    <div className="h-full flex flex-col mx-auto p-6 md:p-10 gap-y-4">
      <ProfileInfo profile={profile} loggedInUserId={loggedInUserId} />
      <ProfilePosts posts={items} isMyProfile={isMyProfile} userId={userId} />
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
    </div>
  );
}
