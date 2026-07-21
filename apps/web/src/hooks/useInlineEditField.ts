'use client';

import { useCallback, useRef, useState } from 'react';

export interface UseInlineEditFieldOptions<T> {
  onCommit: (next: T) => Promise<void>;
  onCommitError?: (error: unknown) => void;
  /** 기본값: Object.is(next, seed) — draft가 편집 시작 시점 값과 같으면 커밋을 건너뛴다 */
  isNoOpChange?: (next: T, seed: T) => boolean;
}

export interface UseInlineEditFieldResult<T> {
  isEditing: boolean;
  draft: T | undefined;
  isSaving: boolean;
  startEdit: (seed: T) => void;
  setDraft: (next: T) => void;
  commit: () => Promise<void>;
  cancel: () => void;
}

/**
 * "시작 → 드래프트 편집 → API 커밋 → 취소 시 되돌리기" 패턴의 인라인 편집 상태머신.
 * 실제 저장 로직(API 호출·성공/실패 피드백)은 onCommit/onCommitError로 주입받아
 * 도메인별 차이(토스트 문구, 후속 캐시 동기화 등)를 흡수한다.
 */
export function useInlineEditField<T>({
  onCommit,
  onCommitError,
  isNoOpChange = Object.is,
}: UseInlineEditFieldOptions<T>): UseInlineEditFieldResult<T> {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraftState] = useState<T | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const seedRef = useRef<T | undefined>(undefined);

  const startEdit = useCallback((seed: T) => {
    seedRef.current = seed;
    setDraftState(seed);
    setIsEditing(true);
  }, []);

  const setDraft = useCallback((next: T) => {
    setDraftState(next);
  }, []);

  const commit = useCallback(async () => {
    if (!isEditing || isSaving || draft === undefined) return;

    const seed = seedRef.current as T;
    if (isNoOpChange(draft, seed)) return;

    setIsSaving(true);
    try {
      await onCommit(draft);
      setIsEditing(false);
    } catch (error) {
      onCommitError?.(error);
    } finally {
      setIsSaving(false);
    }
  }, [isEditing, isSaving, draft, isNoOpChange, onCommit, onCommitError]);

  const cancel = useCallback(() => {
    setDraftState(seedRef.current);
    setIsEditing(false);
  }, []);

  return { isEditing, draft, isSaving, startEdit, setDraft, commit, cancel };
}
