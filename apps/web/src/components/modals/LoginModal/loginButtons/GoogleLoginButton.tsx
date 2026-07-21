'use client';

import React, { useState } from 'react';
import Image from 'next/image';

import LoginActionButton from './LoginActionButton';

const GOOGLE_AUTH_START_PATH = '/auth/google';

export const GoogleLoginButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    if (isLoading) return;
    setIsLoading(true);
    window.location.assign(GOOGLE_AUTH_START_PATH);
  };

  return (
    <LoginActionButton
      onClick={handleGoogleLogin}
      isLoading={isLoading}
      className="px-6 py-4 font-black border border-primary bg-white text-primary hover:bg-gray-50"
      spinnerClassName="border-primary"
      icon={<Image src="/Google.svg" alt="Google" width={27} height={27} className="shrink-0" />}
      label="Google로 로그인"
      loadingLabel="Google로 이동 중…"
    />
  );
};
