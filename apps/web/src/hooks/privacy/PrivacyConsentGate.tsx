'use client';

import { useEffect, useRef } from 'react';
import { MODAL_TYPES, useModalStore } from '@/stores';
import { useAuthMe } from '@/hooks/auth/client';
import { getRecentConsents } from '@/api';

export function PrivacyConsentGate() {
  const { isAuthenticated, isLoading } = useAuthMe();
  const openModal = useModalStore((s) => s.openModal);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    if (isLoading || !isAuthenticated) return;

    ranRef.current = true;

    (async () => {
      const { items } = await getRecentConsents();
      const isPrivacyConsentNeeded = items.length === 0;
      if (isPrivacyConsentNeeded) {
        openModal(MODAL_TYPES.PRIVACY_CONCENT);
      }
    })().catch(() => {
      // 실패 시...?
    });
  }, [isLoading, isAuthenticated, openModal]);

  return null;
}
