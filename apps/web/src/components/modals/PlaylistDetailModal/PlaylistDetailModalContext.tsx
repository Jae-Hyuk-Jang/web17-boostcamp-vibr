'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { usePlaylistDetailModal, type UsePlaylistDetailModalResult } from '@/hooks/playlist/usePlaylistDetailModal';

const PlaylistDetailModalContext = createContext<UsePlaylistDetailModalResult | null>(null);

type ValueProviderProps = {
  value: UsePlaylistDetailModalResult;
  children: ReactNode;
};

/** 값을 직접 주입하는 순수 Provider — 훅을 호출하지 않아 컴포넌트 단독 테스트에 쓴다. */
export function PlaylistDetailModalValueProvider({ value, children }: ValueProviderProps) {
  return <PlaylistDetailModalContext.Provider value={value}>{children}</PlaylistDetailModalContext.Provider>;
}

type ProviderProps = {
  playlistId: string;
  children: ReactNode;
};

/**
 * usePlaylistDetailModal은 이 모달 트리 전체가 공유하는 오케스트레이션(조회, mutation 4개,
 * UI 로컬 state)을 소유한 훅이라 반드시 한 곳에서만 호출돼야 한다 — 이 Provider가 그 유일한
 * 호출 지점이다. playlist가 아직 로딩 중이면(초기 조회 전) children 자체를 렌더링하지 않아,
 * 기존 PlaylistDetailModal.tsx의 `playlist && (...)` 가드와 동일하게 동작한다.
 */
export function PlaylistDetailModalProvider({ playlistId, children }: ProviderProps) {
  const modal = usePlaylistDetailModal(playlistId);
  if (!modal.playlist) return null;

  return <PlaylistDetailModalValueProvider value={modal}>{children}</PlaylistDetailModalValueProvider>;
}

export function usePlaylistDetailModalContext(): UsePlaylistDetailModalResult {
  const v = useContext(PlaylistDetailModalContext);
  if (!v) throw new Error('usePlaylistDetailModalContext must be used within PlaylistDetailModalProvider');
  return v;
}
