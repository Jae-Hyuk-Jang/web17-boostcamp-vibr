'use client';

import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ModalShell from '@/components/ui/ModalShell';
import ModalPanel from '@/components/ui/ModalPanel';
import ModalCloseButton from '@/components/ui/ModalCloseButton';
import { ProfileActionButton } from '@/components/profile';
import { DEFAULT_IMAGES } from '@/constants';
import type { GetUserDto as Profile, GetUserFollowDto, UserWithFollowStatusDto } from '@repo/dto';
import { useModalStore } from '@/stores';
import { useAuthMe } from '@/hooks/auth/client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useInfiniteScrollTrigger } from '@/hooks';
import { profileQueryKey, userListQueryKey } from '@/query-keys';

interface UserListModalProps {
  title: string;
  fetchFn: (userId: string, cursor?: string | undefined, limit?: number) => Promise<GetUserFollowDto>;
}

type Page = {
  items: UserWithFollowStatusDto[];
  hasNext: boolean;
  nextCursor?: string;
};

export const UserListModal = ({ title, fetchFn }: UserListModalProps) => {
  const { modalProps, closeModal } = useModalStore();
  const { profileUserId } = modalProps as { profileUserId: string };

  const router = useRouter();
  const { userId: loggedInUserId } = useAuthMe();
  const queryClient = useQueryClient();

  const queryKey = userListQueryKey(profileUserId, title);

  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }: { pageParam: string | undefined }): Promise<Page> => {
      if (pageParam !== undefined) await new Promise((resolve) => setTimeout(resolve, 300)); // 로딩 스피너 짧게 노출

      const data = await fetchFn(profileUserId, pageParam);
      return { items: data.users, hasNext: data.hasNext, nextCursor: data.nextCursor };
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

  /** 팔로우/언팔로우 후 사용자 목록 및 프로필 정보(팔로잉 수) 상태 업데이트 함수 */
  const handleFollowActionComplete = (updatedUserId: string, prevIsFollowing: boolean) => {
    // 모달의 사용자 목록 쿼리 캐시 업데이트
    queryClient.setQueryData(queryKey, (old: InfiniteData<Page> | undefined) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          items: page.items.map((user) => (user.id === updatedUserId ? { ...user, isFollowing: !user.isFollowing } : user)),
        })),
      };
    });

    // 내가 내 프로필에서 다른 사람을 팔로우/언팔로우 하는 경우, 내 프로필의 팔로잉 수 캐시도 갱신
    if (profileUserId === loggedInUserId) {
      queryClient.setQueryData(profileQueryKey(loggedInUserId), (prev: Profile | undefined) => {
        if (!prev) return prev;
        return { ...prev, followingCount: prevIsFollowing ? prev.followingCount - 1 : prev.followingCount + 1 };
      });
    }
  };

  /** 프로필 클릭 시 해당 프로필 페이지 내비게이션 함수 */
  const handleProfileClick = (profileUserId: string) => {
    closeModal();
    router.push(`/profile/${profileUserId}`);
  };

  return (
    <ModalShell
      onClose={closeModal}
      ariaLabel={title}
      className="flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4 animate-fade-in"
    >
      <ModalPanel className="relative w-full max-w-sm md:max-w-md h-[50vh] animate-scale-up z-10">
        {/* 모달 헤더 영역 */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-primary bg-white">
          <h2 className="text-xl font-black text-primary">{title}</h2>
          <ModalCloseButton
            onClick={closeModal}
            className="p-1 hover:bg-grayish rounded-full transition-colors"
            iconClassName="w-6 h-6 text-primary"
          />
        </div>

        {/* 사용자 목록 */}
        {isInitialLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="flex-1 overflow-y-auto p-2">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                <p className="font-bold text-sm">사용자가 없습니다.</p>
              </div>
            ) : (
              <ul className="space-y-1">
                {items.map((user, idx) => {
                  return (
                    <li key={user.id + idx} className="flex items-center justify-between p-3 hover:bg-grayish rounded-xl transition-colors group">
                      <div className="flex items-center flex-1 min-w-0 mr-4">
                        <button onClick={() => handleProfileClick(user.id)} className="relative shrink-0 w-10 h-10">
                          <Image
                            src={user.profileImgUrl || DEFAULT_IMAGES.PROFILE}
                            alt={user.nickname}
                            fill
                            className="rounded-full border border-primary object-cover"
                          />
                        </button>
                        <p className="ml-3 min-w-0 font-bold text-md text-primary truncate">{user.nickname}</p>
                      </div>

                      {/* 사용자별 액션 버튼 */}
                      <ProfileActionButton
                        loggedInUserId={loggedInUserId}
                        profileUserId={user.id}
                        isFollowing={user.isFollowing}
                        renderIn="modal"
                        onFollowActionComplete={() => handleFollowActionComplete(user.id, user.isFollowing)}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
            {/** 무한 스크롤 처리 영역 */}
            {errorMsg && (
              <div className="text-center">
                <p>{errorMsg}</p>
                <p className="text-sm mt-2">다시 시도해주세요.</p>
              </div>
            )}
            {hasNextPage && (
              <div ref={ref}>
                <LoadingSpinner hStyle="py-6" />
              </div>
            )}
          </div>
        )}
      </ModalPanel>
    </ModalShell>
  );
};
