'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { UsePostDetailModalResult } from '@/hooks/post/usePostDetailModal';

type PostDetailReactionsValue = UsePostDetailModalResult['reactions'];

const PostDetailReactionsContext = createContext<PostDetailReactionsValue | null>(null);

type ProviderProps = {
  value: PostDetailReactionsValue;
  children: ReactNode;
};

export function PostDetailReactionsProvider({ value, children }: ProviderProps) {
  return <PostDetailReactionsContext.Provider value={value}>{children}</PostDetailReactionsContext.Provider>;
}

export function usePostDetailReactionsContext(): PostDetailReactionsValue {
  const v = useContext(PostDetailReactionsContext);
  if (!v) throw new Error('usePostDetailReactionsContext must be used within PostDetailReactionsProvider');
  return v;
}
