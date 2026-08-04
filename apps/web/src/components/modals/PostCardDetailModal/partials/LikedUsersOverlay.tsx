'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { DEFAULT_IMAGES } from '@/constants';
import { coalesceImageSrc } from '@/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ModalCloseButton from '@/components/ui/ModalCloseButton';
import ModalPanel from '@/components/ui/ModalPanel';

import { usePostDetailModalContext } from '../PostDetailModalContext';

export default function LikedUsersOverlay() {
  const router = useRouter();
  const { likedUsers } = usePostDetailModalContext();
  const { isOpen, close: onClose, users, isLoading, errorMsg, refetch: onRetry } = likedUsers;

  if (!isOpen) return null;

  const handleUserClick = (userId: string) => {
    onClose();
    router.push(`/profile/${userId}`);
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <div className="py-6">
          <LoadingSpinner />
        </div>
      );
    }

    if (errorMsg) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
          <p className="font-bold text-sm">{errorMsg}</p>
          <button type="button" onClick={onRetry} className="mt-3 text-xs font-bold underline text-gray-600">
            다시 시도
          </button>
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-gray-400 py-10">
          <p className="font-bold text-sm">좋아요한 사용자가 없습니다.</p>
        </div>
      );
    }

    return (
      <ul className="space-y-1">
        {users.map((u) => (
          <li key={u.id} className="flex items-center p-3 hover:bg-grayish rounded-xl transition-colors">
            <button type="button" onClick={() => handleUserClick(u.id)} className="relative shrink-0 w-10 h-10">
              <Image
                src={coalesceImageSrc(u.profileImgUrl, DEFAULT_IMAGES.PROFILE)}
                alt={u.nickname}
                fill
                className="rounded-full border border-primary object-cover"
              />
            </button>
            <p className="ml-3 min-w-0 font-bold text-md text-primary truncate">{u.nickname}</p>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4 animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <ModalPanel className="relative w-full max-w-md max-h-[60vh] animate-scale-up">
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-primary bg-white">
          <h2 className="text-xl font-black text-primary">좋아요</h2>
          <ModalCloseButton onClick={onClose} className="p-1 hover:bg-grayish rounded-full transition-colors" iconClassName="w-6 h-6 text-primary" />
        </div>

        <div className="flex-1 overflow-y-auto p-2">{renderBody()}</div>
      </ModalPanel>
    </div>
  );
}
