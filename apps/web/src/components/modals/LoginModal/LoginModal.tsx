'use client';

import React from 'react';
import { useModalStore } from '@/stores/useModalStore';
import { getAuthErrorMessage } from '@/hooks/auth/client/authErrorMessage';
import { GoogleLoginButton, TmpLoginButton } from './loginButtons';
import ModalShell from '@/components/ui/ModalShell';
import ModalPanel from '@/components/ui/ModalPanel';
import ModalCloseButton from '@/components/ui/ModalCloseButton';

type LoginModalProps = {
  authError?: string;
};

export const LoginModal = () => {
  const { closeModal, modalProps } = useModalStore();
  const { authError } = (modalProps ?? {}) as LoginModalProps;
  const errorMessage = authError ? getAuthErrorMessage(authError) : undefined;

  return (
    <ModalShell
      onClose={closeModal}
      ariaLabel="로그인"
      className="flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4 animate-fade-in"
    >
      <ModalPanel className="w-full max-w-md shadow-[8px_8px_0px_0px_var(--color-primary)] transition-all">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-primary bg-white z-10 shrink-0">
          <h2 className="text-xl font-black text-primary">로그인</h2>
          <ModalCloseButton onClick={closeModal} />
        </div>

        {/* 바디 */}
        <div className="px-10 py-20 flex flex-col gap-4">
          {errorMessage && (
            <div className="text-sm font-bold text-secondary border border-secondary/40 bg-secondary/5 rounded-xl px-4 py-3">{errorMessage}</div>
          )}
          <GoogleLoginButton />
          {/* <SpotifyLoginButton /> */}
          {process.env.NODE_ENV !== 'production' && <TmpLoginButton />}
        </div>
      </ModalPanel>
    </ModalShell>
  );
};
