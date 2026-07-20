import { render, fireEvent } from '@testing-library/react';

import MobileNowPlaylistModal from './MobileNowPlaylistModal';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { usePlayerStore } from '@/stores/usePlayerStore';

describe('MobileNowPlaylistModal — 배경 클릭 특성화 테스트 (#66)', () => {
  beforeEach(() => {
    useModalStore.setState({ isOpen: true, modalType: MODAL_TYPES.MOBILE_QUEUE, modalProps: {} });
    usePlayerStore.setState({ queue: [], currentMusic: null });
  });

  it('배경을 클릭하면 모달이 닫힌다', () => {
    const { container } = render(<MobileNowPlaylistModal />);
    const backdrop = container.querySelector('.fixed.inset-x-0.top-0') as HTMLElement;

    fireEvent.click(backdrop);

    expect(useModalStore.getState().isOpen).toBe(false);
  });
});
