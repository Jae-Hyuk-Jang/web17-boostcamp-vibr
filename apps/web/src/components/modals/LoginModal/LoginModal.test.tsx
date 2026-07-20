import { render, screen, fireEvent } from '@testing-library/react';

import { LoginModal } from './LoginModal';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';

describe('LoginModal — 배경 클릭/닫기 버튼 특성화 테스트 (#66)', () => {
  beforeEach(() => {
    useModalStore.setState({ isOpen: true, modalType: MODAL_TYPES.LOGIN, modalProps: {} });
  });

  it('배경을 클릭하면 모달이 닫힌다', () => {
    const { container } = render(<LoginModal />);

    fireEvent.mouseDown(container.firstChild as HTMLElement);

    expect(useModalStore.getState().isOpen).toBe(false);
  });

  it('닫기 버튼을 클릭하면 모달이 닫힌다', () => {
    render(<LoginModal />);

    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(useModalStore.getState().isOpen).toBe(false);
  });
});
