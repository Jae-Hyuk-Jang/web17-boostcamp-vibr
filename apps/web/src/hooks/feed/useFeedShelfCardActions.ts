'use client';

import { useRouter } from 'next/navigation';
import type { FeedShelfItemDto } from '@repo/dto';
import { MODAL_TYPES, useModalStore, usePlayerStore } from '@/stores';

/** 선반 카드에서 할 수 있는 일: 상세 열기, 전체 재생, 만든 사람 프로필로 가기 */
export const useFeedShelfCardActions = () => {
  const router = useRouter();
  const openModal = useModalStore((s) => s.openModal);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const selectMusic = usePlayerStore((s) => s.selectMusic);

  const handleOpen = (item: FeedShelfItemDto) => {
    // 플레이리스트 페이지가 생기기 전까지는 반응 기록 상세 모달로 연다
    openModal(MODAL_TYPES.POST_DETAIL, { postId: item.reactionId });
  };

  const handlePlayAll = (item: FeedShelfItemDto) => {
    const [firstMusic] = item.musics;
    if (!firstMusic) return;
    addToQueue(item.musics);
    selectMusic(firstMusic);
  };

  const handleOwnerClick = (ownerId: string) => {
    router.push(`/profile/${ownerId}`);
  };

  return { handleOpen, handlePlayAll, handleOwnerClick };
};
