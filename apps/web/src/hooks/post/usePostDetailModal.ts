'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'react-toastify';
import type { MusicResponseDto as Music, PostResponseDto as Post } from '@repo/dto';

import { useModalStore, MODAL_TYPES, usePlayerStore, usePostReactionOverridesStore, useAuthStore } from '@/stores';
import useIsMobile from '@/hooks/useIsMobile';
import { useScrollLock, usePostDetail, useLikedUsers, usePostReactions, usePostDetailUxLog, useInlineEditField } from '@/hooks';
import { EMPTY_POST, DEFAULT_IMAGES } from '@/constants';
import { coalesceImageSrc } from '@/utils';
import { updatePost } from '@/api';

export interface UsePostDetailModalResult {
  isEnabled: boolean;
  postId: string | undefined;
  safePost: Post;
  isLoading: boolean;
  error: string | null;
  isOwner: boolean;
  profileImg: string;

  reactions: ReturnType<typeof usePostReactions>;
  likedUsers: {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    users: ReturnType<typeof useLikedUsers>['users'];
    isLoading: boolean;
    errorMsg: string | null;
    refetch: () => void;
  };
  editing: ReturnType<typeof useInlineEditField<string>>;

  player: {
    currentMusicId: string | null;
    isPlaying: boolean;
    handlePlayFromPost: (m: Music) => void;
    handlePlayAll: () => void;
  };

  handleClose: () => void;
  handleUserClick: (targetUserId: string) => void;
}

/**
 * PostCardDetailModal의 오케스트레이션 훅 — 데이터 조합, 플레이어 연동,
 * 리사이즈 시 라우팅 전환, 편집 모드를 한데 모은다.
 * useSwipeToDismiss는 옮기지 않는다(이미 정상 재사용되던 부분).
 */
export function usePostDetailModal(): UsePostDetailModalResult {
  const userId = useAuthStore((s) => s.userId);
  const router = useRouter();
  const { isOpen, modalType, modalProps, closeModal } = useModalStore();
  const isEnabled = isOpen && modalType === MODAL_TYPES.POST_DETAIL;

  useScrollLock(isEnabled);

  const postId = isEnabled ? (modalProps?.postId as string | undefined) : undefined;
  const passedPost = isEnabled ? ((modalProps?.post as Post | undefined) ?? undefined) : undefined;

  useEffect(() => {
    if (!isEnabled) return;
    if (!postId) closeModal();
  }, [isEnabled, postId, closeModal]);

  const { post, isLoading, error, updatePostContent } = usePostDetail({ enabled: isEnabled, postId, passedPost });
  const isOwner = userId === post?.author.id;
  const safePost = post ?? passedPost ?? EMPTY_POST;

  const setContentOverride = usePostReactionOverridesStore((s) => s.setContentOverride);
  const likeOverride = usePostReactionOverridesStore((s) => (postId ? s.likesByPostId[postId] : undefined));

  const isLikedInitially = likeOverride?.isLiked ?? post?.isLiked ?? passedPost?.isLiked ?? false;
  const initialLikeCount = likeOverride?.likeCount ?? post?.likeCount ?? passedPost?.likeCount ?? 0;

  const reactions = usePostReactions({
    enabled: Boolean(isEnabled && postId),
    postId: postId ?? '',
    initialIsLiked: isLikedInitially,
    initialLikeCount,
  });

  const [isLikedUsersOpen, setIsLikedUsersOpen] = useState(false);
  useEffect(() => {
    if (!isEnabled) return;
    setIsLikedUsersOpen(false);
  }, [isEnabled, postId]);

  const likedUsersState = useLikedUsers({
    enabled: Boolean(isEnabled && postId && isLikedUsersOpen),
    postId: postId ?? '',
  });

  const playMusic = usePlayerStore((s) => s.playMusic);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const selectMusic = usePlayerStore((s) => s.selectMusic);
  const currentMusicId = usePlayerStore((s) => s.currentMusic?.id ?? null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const profileImg = useMemo(() => coalesceImageSrc(safePost.author.profileImgUrl, DEFAULT_IMAGES.PROFILE), [safePost.author.profileImgUrl]);

  // 데스크탑 → 모바일 리사이즈 시, 프로필 페이지에서 열린 모달이면 posts 피드 페이지로 전환
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const isMobileInitializedRef = useRef(false);
  const prevIsMobileRef = useRef(false);
  useEffect(() => {
    if (!isMobileInitializedRef.current) {
      isMobileInitializedRef.current = true;
      prevIsMobileRef.current = isMobile;
      return;
    }
    const isPreviouslyMobile = prevIsMobileRef.current;
    prevIsMobileRef.current = isMobile;

    if (!isPreviouslyMobile && isMobile && isEnabled && postId) {
      const profileMatch = pathname.match(/^\/profile\/([^/]+)$/);
      if (profileMatch) {
        closeModal();
        router.push(`/profile/${profileMatch[1]}/posts?postId=${postId}`);
      }
    }
  }, [isMobile, isEnabled, pathname, postId, router, closeModal]);

  // 게시글 수정 — PostCard.tsx가 modalProps.initialIsEditing으로 곧바로 편집 모드 진입을 요청할 수 있다
  const initialEditSeed = modalProps?.initialIsEditing === true ? ((modalProps?.initialEditingContent as string | undefined) ?? '') : undefined;
  const editing = useInlineEditField<string>({
    initialSeed: initialEditSeed,
    onCommit: async (next) => {
      if (!postId) return;
      await updatePost(postId, { content: next });
      toast.success('게시글을 수정했습니다.');
      updatePostContent(next);
      setContentOverride(postId, { content: next });
    },
    onCommitError: (err) => {
      toast.error('게시글 수정에 실패했습니다.');
      console.error('게시글 수정 실패:', err);
    },
  });

  // UX 로그 수집(상세모달 체류 시간·재생한 곡 수·곡별 재생 시간, 중복 전송 방지)
  const postMusicIds = useMemo(() => safePost.musics.map((m) => m.id), [safePost.musics]);
  const { recordPlayedMusic, emit } = usePostDetailUxLog({
    enabled: isEnabled,
    postId,
    userId,
    isPlaying,
    currentMusicId,
    postMusicIds,
  });

  const handlePlayFromPost = useCallback(
    (m: Music) => {
      if (m?.id) recordPlayedMusic(m.id);
      playMusic(m);
    },
    [playMusic, recordPlayedMusic],
  );

  const handlePlayAll = useCallback(() => {
    const musics = safePost.musics;
    if (!musics.length) return;
    const firstMusic = musics[0];
    if (!firstMusic) return;
    addToQueue(musics);
    recordPlayedMusic(firstMusic.id);
    selectMusic(firstMusic);
  }, [safePost.musics, addToQueue, selectMusic, recordPlayedMusic]);

  const handleClose = useCallback(() => {
    emit();
    closeModal();
  }, [emit, closeModal]);

  // 모달 unmount/disable 시에도 summary 전송(백업) — emit 내부의 emitOnce 가드라 중복 없음
  useEffect(() => {
    if (!isEnabled) return;
    return () => {
      emit();
    };
  }, [isEnabled, emit]);

  const handleUserClick = useCallback(
    (targetUserId: string) => {
      router.push(`/profile/${targetUserId}`);
    },
    [router],
  );

  return {
    isEnabled,
    postId,
    safePost,
    isLoading,
    error,
    isOwner,
    profileImg,

    reactions,
    likedUsers: {
      isOpen: isLikedUsersOpen,
      open: () => setIsLikedUsersOpen(true),
      close: () => setIsLikedUsersOpen(false),
      users: likedUsersState.users,
      isLoading: likedUsersState.isLoading,
      errorMsg: likedUsersState.errorMsg,
      refetch: likedUsersState.refetch,
    },
    editing,

    player: {
      currentMusicId,
      isPlaying,
      handlePlayFromPost,
      handlePlayAll,
    },

    handleClose,
    handleUserClick,
  };
}
