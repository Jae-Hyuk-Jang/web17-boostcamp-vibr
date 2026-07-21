import { render, screen, fireEvent } from '@testing-library/react';
import type { LikedUserDto } from '@repo/dto';

import LikedUsersOverlay from './LikedUsersOverlay';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockUser = (overrides: Partial<LikedUserDto> = {}): LikedUserDto => ({
  id: 'user-1',
  nickname: 'nickname',
  profileImgUrl: null,
  ...overrides,
});

const baseProps = {
  isOpen: true,
  onClose: jest.fn(),
  users: [] as LikedUserDto[],
  isLoading: false,
  errorMsg: null as string | null,
  onRetry: jest.fn(),
};

describe('LikedUsersOverlay', () => {
  beforeEach(() => {
    mockPush.mockClear();
    baseProps.onClose = jest.fn();
    baseProps.onRetry = jest.fn();
  });

  it('isOpen이 false면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<LikedUsersOverlay {...baseProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('로딩 중이면 로딩 스피너를 보여준다', () => {
    render(<LikedUsersOverlay {...baseProps} isLoading={true} />);
    expect(screen.queryByText('좋아요한 사용자가 없습니다.')).not.toBeInTheDocument();
  });

  it('에러가 있으면 에러 메시지와 다시 시도 버튼을 보여주고, 클릭하면 onRetry가 호출된다', () => {
    render(<LikedUsersOverlay {...baseProps} errorMsg="불러오지 못했습니다." />);

    expect(screen.getByText('불러오지 못했습니다.')).toBeInTheDocument();

    fireEvent.click(screen.getByText('다시 시도'));
    expect(baseProps.onRetry).toHaveBeenCalledTimes(1);
  });

  it('사용자가 없으면 빈 상태 메시지를 보여준다', () => {
    render(<LikedUsersOverlay {...baseProps} />);
    expect(screen.getByText('좋아요한 사용자가 없습니다.')).toBeInTheDocument();
  });

  it('사용자 목록을 렌더링하고, 클릭하면 닫고 해당 프로필로 이동한다', () => {
    render(<LikedUsersOverlay {...baseProps} users={[mockUser({ id: 'user-1', nickname: 'Alice' })]} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Alice' }));

    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/profile/user-1');
  });

  it('배경을 클릭하면 onClose가 호출된다', () => {
    const { container } = render(<LikedUsersOverlay {...baseProps} />);

    fireEvent.mouseDown(container.firstElementChild as HTMLElement);

    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('패널 내부를 클릭해도 onClose가 호출되지 않는다', () => {
    render(<LikedUsersOverlay {...baseProps} />);

    fireEvent.mouseDown(screen.getByText('좋아요'));

    expect(baseProps.onClose).not.toHaveBeenCalled();
  });

  it('닫기 버튼을 클릭하면 onClose가 호출된다', () => {
    render(<LikedUsersOverlay {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
  });
});
