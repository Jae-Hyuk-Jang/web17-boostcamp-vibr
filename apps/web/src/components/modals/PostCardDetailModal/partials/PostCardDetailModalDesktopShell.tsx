'use client';

import { PostHeader } from '@/components/post';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { PostMedia } from '@/components/post';
import ModalShell from '@/components/ui/ModalShell';

import { usePostDetailModalContext } from '../PostDetailModalContext';
import PostDetailBody from './PostDetailBody';
import PostDetailActions from './PostDetailActions';
import PostDetailCommentComposer from './PostDetailCommentComposer';
import PostDetailEditForm from './PostDetailEditForm';

export default function PostCardDetailModalDesktopShell() {
  const {
    safePost: post,
    postId,
    isLoading,
    error,
    isOwner,
    editing,
    player,
    likedUsers,
    handleClose: onClose,
    closeModal,
    handleUserClick: onUserClick,
  } = usePostDetailModalContext();

  const onDeletePost = () => closeModal();
  const onOpenLikedUsers = () => likedUsers.open();

  return (
    <ModalShell
      onClose={onClose}
      ariaLabel="게시글 상세"
      className="hidden lg:flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div className="bg-white w-full max-w-5xl h-full max-h-[85vh] rounded-2xl border-2 border-primary shadow-2xl flex flex-col md:flex-row overflow-hidden animate-scale-up">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="flex-1 flex items-center justify-center bg-gray-4">
            <div className="text-sm font-bold text-gray-500">{error}</div>
          </div>
        ) : (
          <PostMedia
            post={post}
            variant="modal"
            currentMusicId={player.currentMusicId}
            isPlayingGlobal={player.isPlaying}
            onPlay={player.handlePlayFromPost}
            onPlayAll={player.handlePlayAll}
          />
        )}

        <div className="w-full md:w-105 flex flex-col bg-white border-l-2 border-primary flex-1 min-h-0">
          <div className="mt-4 px-4 py-2 border-b-2 border-primary/10">
            <PostHeader
              post={post}
              isOwner={isOwner}
              onUserClick={() => onUserClick(post.author.id)}
              onEditPost={isOwner ? () => editing.startEdit(post.content) : undefined}
              onDeletePost={isOwner ? onDeletePost : undefined}
            />
          </div>

          {editing.isEditing ? <PostDetailEditForm /> : <PostDetailBody />}

          <PostDetailActions postId={postId} onOpenLikedUsers={onOpenLikedUsers} />
          <PostDetailCommentComposer />
        </div>
      </div>
    </ModalShell>
  );
}
