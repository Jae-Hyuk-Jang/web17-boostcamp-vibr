'use client';

import ModalShell from '@/components/ui/ModalShell';
import ModalPanel from '@/components/ui/ModalPanel';
import ModalCloseButton from '@/components/ui/ModalCloseButton';
import { useModalStore } from '@/stores/useModalStore';
import { PrivacyConsentForm } from './PrivacyConsentForm';

export const PrivacyConsentModal = () => {
  const { closeModal } = useModalStore();

  return (
    <ModalShell
      onClose={closeModal}
      closeOnBackdrop={false}
      ariaLabel="약관 동의"
      className="flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4"
    >
      <ModalPanel className="w-full max-w-lg shadow-[8px_8px_0px_0px_var(--color-primary)]">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-primary">
          <h2 className="text-xl font-black text-primary">약관 동의</h2>
          <ModalCloseButton onClick={closeModal} className="" iconClassName="w-6 h-6 text-primary" />
        </div>

        {/* 바디 - 분리된 폼 호출 */}
        <div className="px-6 py-8">
          <PrivacyConsentForm onSuccess={closeModal} />
        </div>
      </ModalPanel>
    </ModalShell>
  );
};
