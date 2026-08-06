'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { MusicResponseDto as Music } from '@repo/dto';
import { useContentWrite, type UseContentWriteResult } from '@/hooks';
import { useModalStore } from '@/stores';

const ContentWriteContext = createContext<UseContentWriteResult | null>(null);

type ValueProviderProps = {
  value: UseContentWriteResult;
  children: ReactNode;
};

/** 값을 직접 주입하는 순수 Provider — 훅을 호출하지 않아 컴포넌트 단독 테스트에 쓴다. */
export function ContentWriteValueProvider({ value, children }: ValueProviderProps) {
  return <ContentWriteContext.Provider value={value}>{children}</ContentWriteContext.Provider>;
}

type ProviderProps = {
  onSuccess: () => void;
  children: ReactNode;
};

/**
 * useContentWrite는 이 모달 트리 전체가 공유하는 폼 상태(선택 곡·커버·검색·본문)를
 * 소유한 오케스트레이션 훅이라 반드시 한 곳에서만 호출돼야 한다 — 이 Provider가 그 유일한
 * 호출 지점이다. initialMusics도 PostDetailModal(usePostDetailModal)과 동일하게
 * modalProps에서 직접 읽어, ContentWriteModal이 ModalContainer로부터 zero-prop으로 마운트될 수 있게 한다.
 */
export function ContentWriteProvider({ onSuccess, children }: ProviderProps) {
  const { modalProps } = useModalStore();
  const initialMusics = modalProps?.initialMusics as Music[] | undefined;
  const value = useContentWrite({ initialMusics, onSuccess });
  return <ContentWriteValueProvider value={value}>{children}</ContentWriteValueProvider>;
}

export function useContentWriteContext(): UseContentWriteResult {
  const v = useContext(ContentWriteContext);
  if (!v) throw new Error('useContentWriteContext must be used within ContentWriteProvider');
  return v;
}
