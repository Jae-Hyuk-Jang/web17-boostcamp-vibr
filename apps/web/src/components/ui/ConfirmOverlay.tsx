'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';

type Props = {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmOverlay({
  open,
  title = '삭제할까요?',
  description,
  confirmLabel = '삭제',
  cancelLabel = '취소',
  onConfirm,
  onCancel,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      onCancel();
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open, onCancel]);

  if (!open) return null;

  const overlay = (
    <div data-drawer-keep className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30" onClick={onCancel}>
      <div
        ref={ref}
        className="w-[280px] bg-white border-2 border-primary rounded-lg shadow-[4px_4px_0px_0px_#00214D] p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-sm font-black text-primary">{title}</div>
        {description && <div className="text-xs text-gray-500 mt-1">{description}</div>}

        <div className="flex gap-2 mt-3">
          <Button variant="secondary" className="flex-1 rounded-md py-1.5 text-sm hover:bg-gray-50" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="danger" className="flex-1 rounded-md border-0 py-1.5 text-sm hover:opacity-90" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(overlay, document.body) : null;
}
