import { render, screen, fireEvent } from '@testing-library/react';

import { UserListModal } from './UserListModal';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { useAuthStore } from '@/stores/useAuthStore';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

jest.mock('@/hooks', () => {
  const actual = jest.requireActual('@/hooks');
  return {
    ...actual,
    useInfiniteScroll: () => ({
      items: [],
      setItems: jest.fn(),
      hasNext: false,
      nextCursor: undefined,
      isLoading: false,
      isInitialLoading: false,
      initialError: null,
      errorMsg: null,
      ref: { current: null },
      reset: jest.fn(),
    }),
  };
});

describe('UserListModal — 배경 클릭/닫기 버튼 특성화 테스트 (#66)', () => {
  beforeEach(() => {
    useModalStore.setState({ isOpen: true, modalType: MODAL_TYPES.FOLLOWER_USER, modalProps: { profileUserId: 'user-1' } });
    useAuthStore.setState({ userId: 'me', isAuthenticated: true, isLoading: false });
  });

  it('배경(overlay div)을 클릭하면 모달이 닫힌다', () => {
    const { container } = render(<UserListModal title="팔로워" fetchFn={jest.fn()} />);

    const overlay = container.querySelector('.absolute.inset-0') as HTMLElement;
    fireEvent.click(overlay);

    expect(useModalStore.getState().isOpen).toBe(false);
  });

  it('닫기 버튼을 클릭하면 모달이 닫힌다', () => {
    render(<UserListModal title="팔로워" fetchFn={jest.fn()} />);

    fireEvent.click(screen.getByRole('button'));

    expect(useModalStore.getState().isOpen).toBe(false);
  });
});
