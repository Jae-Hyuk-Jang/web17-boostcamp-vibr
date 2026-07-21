'use client';

import { useSwipeToDismiss } from '@/hooks';
import { usePostDetailModal } from '@/hooks/post/usePostDetailModal';

import { PostCardDetailModalMobileSheet, PostCardDetailModalDesktopShell, LikedUsersOverlay } from './partials';

export const PostCardDetailModal = () => {
  const {
    isEnabled,
    postId,
    safePost,
    isLoading,
    error,
    isOwner,
    profileImg,
    reactions,
    likedUsers,
    editing,
    player,
    handleClose,
    closeModal,
    handleUserClick,
  } = usePostDetailModal();

  const { sheetRef, handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeToDismiss(handleClose);

  if (!isEnabled || !postId) return null;

  return (
    <>
      <PostCardDetailModalMobileSheet
        post={safePost}
        profileImg={profileImg}
        reactions={reactions}
        onClose={handleClose}
        sheetRef={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      <PostCardDetailModalDesktopShell
        post={safePost}
        postId={postId}
        isLoading={isLoading}
        error={error}
        isOwner={isOwner}
        profileImg={profileImg}
        reactions={reactions}
        editing={editing}
        player={player}
        onClose={handleClose}
        onDeletePost={() => closeModal()}
        onUserClick={handleUserClick}
        onOpenLikedUsers={() => likedUsers.open()}
      />

      <LikedUsersOverlay
        isOpen={likedUsers.isOpen}
        onClose={() => likedUsers.close()}
        users={likedUsers.users}
        isLoading={likedUsers.isLoading}
        errorMsg={likedUsers.errorMsg}
        onRetry={() => likedUsers.refetch()}
      />
    </>
  );
};
