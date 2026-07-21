import { renderHook, act } from '@testing-library/react';

import { useInlineEditField } from './useInlineEditField';

describe('useInlineEditField', () => {
  it('startEdit(seed) 호출 시 isEditing=true, draft=seed가 된다', () => {
    const { result } = renderHook(() => useInlineEditField<string>({ onCommit: jest.fn() }));

    act(() => {
      result.current.startEdit('original');
    });

    expect(result.current.isEditing).toBe(true);
    expect(result.current.draft).toBe('original');
  });

  it('commit 성공 시 onCommit이 draft로 호출되고 isSaving이 true→false로 전이하며 isEditing=false가 된다', async () => {
    const onCommit = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useInlineEditField<string>({ onCommit }));

    act(() => {
      result.current.startEdit('original');
    });
    act(() => {
      result.current.setDraft('updated');
    });

    let commitPromise!: Promise<void>;
    act(() => {
      commitPromise = result.current.commit();
    });
    expect(result.current.isSaving).toBe(true);

    await act(async () => {
      await commitPromise;
    });

    expect(onCommit).toHaveBeenCalledWith('updated');
    expect(result.current.isSaving).toBe(false);
    expect(result.current.isEditing).toBe(false);
  });

  it('commit 실패 시 onCommitError가 호출되고 isEditing은 유지된다', async () => {
    const error = new Error('fail');
    const onCommit = jest.fn().mockRejectedValue(error);
    const onCommitError = jest.fn();
    const { result } = renderHook(() => useInlineEditField<string>({ onCommit, onCommitError }));

    act(() => {
      result.current.startEdit('original');
    });
    act(() => {
      result.current.setDraft('updated');
    });

    await act(async () => {
      await result.current.commit();
    });

    expect(onCommitError).toHaveBeenCalledWith(error);
    expect(result.current.isEditing).toBe(true);
    expect(result.current.isSaving).toBe(false);
  });

  it('draft가 편집 시작 시점 값과 같으면 commit이 onCommit을 호출하지 않는다(no-op)', async () => {
    const onCommit = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useInlineEditField<string>({ onCommit }));

    act(() => {
      result.current.startEdit('original');
    });

    await act(async () => {
      await result.current.commit();
    });

    expect(onCommit).not.toHaveBeenCalled();
    expect(result.current.isEditing).toBe(true);
  });

  it('cancel 시 draft가 편집 시작 시점 값으로 복귀하고 isEditing=false가 된다', () => {
    const { result } = renderHook(() => useInlineEditField<string>({ onCommit: jest.fn() }));

    act(() => {
      result.current.startEdit('original');
    });
    act(() => {
      result.current.setDraft('changed');
    });
    act(() => {
      result.current.cancel();
    });

    expect(result.current.isEditing).toBe(false);
    expect(result.current.draft).toBe('original');
  });

  it('initialSeed가 있으면 최초 렌더부터 편집 모드로 시작한다', () => {
    const { result } = renderHook(() => useInlineEditField<string>({ onCommit: jest.fn(), initialSeed: 'seeded content' }));

    expect(result.current.isEditing).toBe(true);
    expect(result.current.draft).toBe('seeded content');
  });

  it('커스텀 isNoOpChange를 넘기면 그 판정을 따른다', async () => {
    const onCommit = jest.fn().mockResolvedValue(undefined);
    const isNoOpChange = jest.fn(() => true);
    const { result } = renderHook(() => useInlineEditField<string>({ onCommit, isNoOpChange }));

    act(() => {
      result.current.startEdit('original');
    });
    act(() => {
      result.current.setDraft('updated');
    });

    await act(async () => {
      await result.current.commit();
    });

    expect(isNoOpChange).toHaveBeenCalledWith('updated', 'original');
    expect(onCommit).not.toHaveBeenCalled();
  });
});
