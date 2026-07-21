'use client';

import React, { useState } from 'react';
import { tmpLogin } from '@/api/internal/auth';
import { APP_ACCESS_TOKEN_STORAGE_KEY } from '@/constants/auth';

import LoginActionButton from './LoginActionButton';

// DEV 전용 시드 유저 (apps/api SEED_USERS와 동일)
const DEV_USERS = [
  { id: '019be163-4b37-76ad-aeb3-6986a3489de6', label: '테스트 사용자 1' },
  { id: '019be163-4b3a-7619-a3cd-75302c5451e6', label: '테스트 사용자 2' },
] as const;

export const TmpLoginButton = () => {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleTmpLogin = async (userId: string) => {
    if (loadingId) return;
    setLoadingId(userId);

    try {
      const appJwt = await tmpLogin(userId);
      sessionStorage.setItem(APP_ACCESS_TOKEN_STORAGE_KEY, appJwt);
      // Google 로그인과 동일하게 리로드로 인증 상태 재평가
      window.location.assign('/');
    } catch {
      setLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-2 border-t border-dashed border-primary/30 pt-4">
      <span className="text-xs font-bold text-secondary">DEV 임시 로그인</span>
      {DEV_USERS.map((user) => (
        <LoginActionButton
          key={user.id}
          onClick={() => handleTmpLogin(user.id)}
          isLoading={loadingId === user.id}
          disabled={loadingId !== null}
          className="px-6 py-3 font-bold text-sm border border-dashed border-primary bg-white text-primary hover:bg-gray-50"
          spinnerClassName="border-primary"
          label={`${user.label}로 로그인`}
          loadingLabel="로그인 중…"
        />
      ))}
    </div>
  );
};
