import { render, screen, fireEvent } from '@testing-library/react';

import { PrivacyConsentModal } from './PrivacyConsentModal';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';

describe('PrivacyConsentModal — 배경 클릭/닫기 버튼 특성화 테스트 (#66)', () => {
  beforeEach(() => {
    useModalStore.setState({ isOpen: true, modalType: MODAL_TYPES.PRIVACY_CONCENT, modalProps: {} });
  });

  it('배경을 클릭해도 모달이 닫히지 않는다', () => {
    const { container } = render(<PrivacyConsentModal />);

    fireEvent.click(container.firstChild as HTMLElement);

    expect(useModalStore.getState().isOpen).toBe(true);
  });

  it('닫기 버튼을 클릭하면 모달이 닫힌다', () => {
    render(<PrivacyConsentModal />);

    fireEvent.click(screen.getAllByRole('button')[0]!);

    expect(useModalStore.getState().isOpen).toBe(false);
  });
});
