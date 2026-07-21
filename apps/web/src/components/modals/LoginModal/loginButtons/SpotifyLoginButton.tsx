'use client';

import React, { useState } from 'react';
import Image from 'next/image';

import LoginActionButton from './LoginActionButton';

export const SpotifyLoginButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSpotifyLogin = () => {
    if (isLoading) return;
    setIsLoading(true);

    const url = new URL('/auth/spotify', window.location.origin);

    window.location.assign(url.toString());
  };

  return (
    <LoginActionButton
      onClick={handleSpotifyLogin}
      isLoading={isLoading}
      className="px-6 py-4 font-black border-none bg-[#1ED760] text-black hover:bg-[#1DB954]"
      spinnerClassName="border-black"
      icon={<Image src="/SpotifyLogo.svg" alt="Spotify" width={27} height={27} className="shrink-0" />}
      label="Spotify로 로그인"
      loadingLabel="Spotify로 이동 중…"
    />
  );
};
