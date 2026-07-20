'use client';

import type { ReactNode } from 'react';

import { MODAL_Z_INDEX } from '@/constants';

export interface ModalShellProps {
  onClose: () => void;
  closeOnBackdrop?: boolean;
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
}

export default function ModalShell({ onClose, closeOnBackdrop = true, className = '', ariaLabel, children }: ModalShellProps) {
  return (
    <div
      className={`fixed inset-0 ${MODAL_Z_INDEX} ${className}`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}
