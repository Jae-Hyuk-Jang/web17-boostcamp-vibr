'use client';

import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

import { BUTTON_DISABLED_CLASSNAME } from '@/constants';

interface LoginActionButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  label: ReactNode;
  loadingLabel: ReactNode;
  className?: string;
  spinnerClassName?: string;
}

const BASE_CLASSNAME = `w-full flex items-center justify-center gap-3 rounded-full transition-all active:scale-[0.98] ${BUTTON_DISABLED_CLASSNAME}`;

export default function LoginActionButton({
  onClick,
  isLoading,
  disabled,
  icon,
  label,
  loadingLabel,
  className = '',
  spinnerClassName = 'border-primary',
}: LoginActionButtonProps) {
  return (
    <button type="button" onClick={onClick} disabled={disabled ?? isLoading} aria-busy={isLoading} className={twMerge(BASE_CLASSNAME, className)}>
      {isLoading ? (
        <>
          <span className={twMerge('h-4 w-4 animate-spin rounded-full border-2 border-t-transparent', spinnerClassName)} />
          {loadingLabel}
        </>
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
    </button>
  );
}
