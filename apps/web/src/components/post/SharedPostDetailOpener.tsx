'use client';

import { useEffect } from 'react';
import type { PostResponseDto as Post } from '@repo/dto';
import { MODAL_TYPES, useModalStore } from '@/stores';

interface SharedPostDetailOpenerProps {
  post: Post;
}

/** 공유 링크(/post/[id])로 들어오면 그 글의 상세 모달을 연다. 화면에는 아무것도 그리지 않는다 */
export default function SharedPostDetailOpener({ post }: SharedPostDetailOpenerProps) {
  const openModal = useModalStore((s) => s.openModal);

  useEffect(() => {
    openModal(MODAL_TYPES.POST_DETAIL, { postId: post.id, initialPost: post });
  }, [post, openModal]);

  return null;
}
