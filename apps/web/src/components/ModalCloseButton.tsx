'use client';

import { X } from 'lucide-react';

export interface ModalCloseButtonProps {
  onClick: () => void;
  className?: string;
  iconClassName?: string;
  ariaLabel?: string;
  title?: string;
}

export default function ModalCloseButton({
  onClick,
  className = 'p-1 hover:bg-gray-4 rounded-full transition-colors group',
  iconClassName = 'w-6 h-6 text-primary group-hover:text-accent-pink transition-colors',
  ariaLabel = '닫기',
  title,
}: ModalCloseButtonProps) {
  return (
    <button type="button" onClick={onClick} className={className} aria-label={ariaLabel} title={title}>
      <X className={iconClassName} />
    </button>
  );
}
