'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { usePostDetailModal, type UsePostDetailModalResult } from '@/hooks/post/usePostDetailModal';

import { PostDetailReactionsProvider } from './PostDetailReactionsContext';

/** Provider가 렌더링을 보장하는 시점엔 postId가 항상 존재한다 — 그 보장을 타입에도 반영한다. */
type PostDetailModalContextValue = Omit<UsePostDetailModalResult, 'postId'> & { postId: string };

const PostDetailModalContext = createContext<PostDetailModalContextValue | null>(null);

type ValueProviderProps = {
  value: PostDetailModalContextValue;
  children: ReactNode;
};

/** 값을 직접 주입하는 순수 Provider — 훅을 호출하지 않아 컴포넌트 단독 테스트에 쓴다. */
export function PostDetailModalValueProvider({ value, children }: ValueProviderProps) {
  return <PostDetailModalContext.Provider value={value}>{children}</PostDetailModalContext.Provider>;
}

type ProviderProps = {
  children: ReactNode;
};

/**
 * usePostDetailModal은 useState/useEffect(편집 draft, UX 로그 emit, 리사이즈→라우팅 전환 등)를
 * 실제로 소유한 오케스트레이션 훅이라 반드시 한 곳에서만 호출돼야 한다 — 이 Provider가 그 유일한
 * 호출 지점이다. isEnabled/postId가 아니면 children 자체를 렌더링하지 않아, 사용하는 쪽에서
 * 별도로 early-return을 반복할 필요가 없다.
 */
export function PostDetailModalProvider({ children }: ProviderProps) {
  const modal = usePostDetailModal();
  if (!modal.isEnabled || !modal.postId) return null;

  return (
    <PostDetailModalValueProvider value={{ ...modal, postId: modal.postId }}>
      <PostDetailReactionsProvider value={modal.reactions}>{children}</PostDetailReactionsProvider>
    </PostDetailModalValueProvider>
  );
}

export function usePostDetailModalContext(): PostDetailModalContextValue {
  const v = useContext(PostDetailModalContext);
  if (!v) throw new Error('usePostDetailModalContext must be used within PostDetailModalProvider');
  return v;
}
