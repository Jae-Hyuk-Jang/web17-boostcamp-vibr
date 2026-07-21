'use client';

import type { PostResponseDto as Post } from '@repo/dto';

import { PostHeader } from '@/components/post';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { PostMedia } from '@/components/post';
import ModalShell from '@/components/ui/ModalShell';
import type { UsePostDetailModalResult } from '@/hooks/post/usePostDetailModal';

import PostDetailBody from './PostDetailBody';
import PostDetailActions from './PostDetailActions';
import PostDetailCommentComposer from './PostDetailCommentComposer';
import PostDetailEditForm from './PostDetailEditForm';

interface PostCardDetailModalDesktopShellProps {
  post: Post;
  postId: string;
  isLoading: boolean;
  error: string | null;
  isOwner: boolean;
  profileImg: string;
  reactions: UsePostDetailModalResult['reactions'];
  editing: UsePostDetailModalResult['editing'];
  player: UsePostDetailModalResult['player'];
  onClose: () => void;
  onDeletePost: () => void;
  onUserClick: (targetUserId: string) => void;
  onOpenLikedUsers: () => void;
}

export default function PostCardDetailModalDesktopShell({
  post,
  postId,
  isLoading,
  error,
  isOwner,
  profileImg,
  reactions,
  editing,
  player,
  onClose,
  onDeletePost,
  onUserClick,
  onOpenLikedUsers,
}: PostCardDetailModalDesktopShellProps) {
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

          {editing.isEditing ? (
            <PostDetailEditForm
              value={editing.draft ?? ''}
              isSaving={editing.isSaving}
              isNoOpChange={editing.draft === post.content}
              onChange={(next) => editing.setDraft(next)}
              onSave={() => editing.commit()}
              onCancel={() => editing.cancel()}
            />
          ) : (
            <PostDetailBody
              profileImg={profileImg}
              nickname={post.author.nickname}
              content={post.content}
              comments={reactions.comments}
              commentsLoading={reactions.isCommentsLoading}
            />
          )}

          <PostDetailActions
            isAuthenticated={reactions.isAuthenticated}
            isSubmitting={reactions.isSubmittingLike}
            isLiked={reactions.isLiked}
            likeCount={reactions.likeCount}
            postId={postId}
            onToggleLike={() => reactions.toggleLike()}
            onOpenLikedUsers={onOpenLikedUsers}
          />
          <PostDetailCommentComposer
            isAuthenticated={reactions.isAuthenticated}
            isSubmitting={reactions.isSubmittingComment}
            value={reactions.commentText}
            onChange={(v) => reactions.setCommentText(v)}
            onSubmit={() => reactions.submitComment()}
          />
        </div>
      </div>
    </ModalShell>
  );
}
