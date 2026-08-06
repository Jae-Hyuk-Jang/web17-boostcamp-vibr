import { render, screen, fireEvent } from '@testing-library/react';

import { ContentWriteModal } from './ContentWriteModal';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';

jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

jest.mock('@/hooks', () => {
  const actual = jest.requireActual('@/hooks');
  return {
    ...actual,
    useContentWrite: () => ({
      selectedMusics: [],
      content: '',
      setContent: jest.fn(),
      searchQuery: '',
      setSearchQuery: jest.fn(),
      isSearchOpen: false,
      setIsSearchOpen: jest.fn(),
      activeCover: null,
      isSubmitDisabled: true,
      onFileChange: jest.fn(),
      onAddMusic: jest.fn(),
      onAddPlaylist: jest.fn(),
      onRemoveMusic: jest.fn(),
      onMoveMusic: jest.fn(),
      onSubmit: jest.fn(),
    }),
  };
});

describe('ContentWriteModal — 배경 클릭/닫기 버튼 특성화 테스트 (#66)', () => {
  beforeEach(() => {
    useModalStore.setState({ isOpen: true, modalType: MODAL_TYPES.WRITE, modalProps: {} });
  });

  it('배경을 클릭해도 모달이 닫히지 않는다', () => {
    const { container } = render(<ContentWriteModal />, { wrapper: createQueryClientWrapper() });

    fireEvent.click(container.firstChild as HTMLElement);

    expect(useModalStore.getState().isOpen).toBe(true);
  });

  it('닫기 버튼을 클릭하면 모달이 닫힌다', () => {
    render(<ContentWriteModal />, { wrapper: createQueryClientWrapper() });

    fireEvent.click(screen.getByRole('button', { name: 'close' }));

    expect(useModalStore.getState().isOpen).toBe(false);
  });
});
