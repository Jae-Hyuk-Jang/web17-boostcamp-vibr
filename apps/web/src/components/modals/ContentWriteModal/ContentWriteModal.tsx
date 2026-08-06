import React from 'react';

import ModalShell from '@/components/ui/ModalShell';
import ModalPanel from '@/components/ui/ModalPanel';
import ModalCloseButton from '@/components/ui/ModalCloseButton';
import Button from '@/components/ui/Button';
import { useModalStore } from '@/stores';
import { CoverImgUploader } from './partials/CoverImgUploader';
import { MusicSearch } from './partials/MusicSearch';
import { SelectedMusicList } from './partials/SelectedMusicList';

import { toast } from 'react-toastify';

import { ContentWriteProvider, useContentWriteContext } from './ContentWriteContext';

export const ContentWriteModal = () => {
  const { closeModal } = useModalStore();

  const handleWriteSuccess = () => {
    toast.success('새 글이 등록되었습니다.');
    closeModal();
  };

  return (
    <ContentWriteProvider onSuccess={handleWriteSuccess}>
      <ContentWriteModalPanel />
    </ContentWriteProvider>
  );
};

function ContentWriteModalPanel() {
  const { closeModal } = useModalStore();
  const { content, setContent, isSubmitDisabled, onSubmit } = useContentWriteContext();

  return (
    <ModalShell
      onClose={closeModal}
      closeOnBackdrop={false}
      ariaLabel="새 게시물 만들기"
      className="flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4 animate-fade-in"
    >
      <ModalPanel className="w-full max-w-2xl shadow-[8px_8px_0px_0px_var(--color-primary)] max-h-[90vh] transition-all">
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-primary bg-white z-10 shrink-0">
          <h2 className="text-xl font-black text-primary">새 게시물 만들기</h2>
          <ModalCloseButton onClick={closeModal} ariaLabel="close" />
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col">
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <CoverImgUploader />
            <SelectedMusicList />
          </div>

          <MusicSearch />

          <div className="mb-2">
            <label htmlFor="postContent" className="text-sm font-bold text-gray-1 mb-2 block">
              내용
            </label>
            <textarea
              id="postContent"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="이 음악에 대한 이야기를 들려주세요..."
              className="w-full h-32 p-4 rounded-xl border-2 border-primary text-primary bg-white focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:bg-gray-4/30 resize-none font-medium custom-scrollbar placeholder:text-gray-2 transition-colors"
            />
          </div>
        </div>

        <div className="p-6 border-t-2 border-primary bg-white shrink-0 flex items-center flex-row-reverse">
          <Button
            className="px-8 hover:shadow-[4px_4px_0px_0px_var(--color-accent-cyan)] disabled:shadow-none"
            disabled={isSubmitDisabled}
            onClick={() => void onSubmit()}
          >
            등록
          </Button>
        </div>
      </ModalPanel>
    </ModalShell>
  );
}
