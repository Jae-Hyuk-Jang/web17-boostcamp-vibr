import { render, screen, fireEvent } from '@testing-library/react';
import type { LikedUserDto } from '@repo/dto';

import LikedUsersOverlay from './LikedUsersOverlay';
import { PostDetailModalValueProvider } from '../PostDetailModalContext';
import type { UsePostDetailModalResult } from '@/hooks/post/usePostDetailModal';

type LikedUsers = UsePostDetailModalResult['likedUsers'];
type ContextValue = Parameters<typeof PostDetailModalValueProvider>[0]['value'];

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

const mockLikedUsers = (overrides: Partial<LikedUsers> = {}): LikedUsers => ({
  isOpen: true,
  open: jest.fn(),
  close: jest.fn(),
  users: [] as LikedUserDto[],
  isLoading: false,
  errorMsg: null,
  refetch: jest.fn(),
  ...overrides,
});

// LikedUsersOverlay가 실제로 쓰는 건 likedUsers뿐이지만, 컨텍스트 타입 전체를 채워야 한다 —
// 나머지 필드는 이 컴포넌트가 참조하지 않으므로 최소한의 더미 값으로 둔다.
const mockContextValue = (likedUsersOverrides: Partial<LikedUsers> = {}): ContextValue =>
  ({
    isEnabled: true,
    postId: 'post-1',
    safePost: {} as UsePostDetailModalResult['safePost'],
    isLoading: false,
    error: null,
    isOwner: false,
    profileImg: '',
    reactions: {} as UsePostDetailModalResult['reactions'],
    likedUsers: mockLikedUsers(likedUsersOverrides),
    editing: {} as UsePostDetailModalResult['editing'],
    player: {} as UsePostDetailModalResult['player'],
    handleClose: jest.fn(),
    closeModal: jest.fn(),
    handleUserClick: jest.fn(),
  }) as ContextValue;

const renderWithLikedUsers = (overrides: Partial<LikedUsers> = {}) =>
  render(
    <PostDetailModalValueProvider value={mockContextValue(overrides)}>
      <LikedUsersOverlay />
    </PostDetailModalValueProvider>,
  );

describe('LikedUsersOverlay', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('isOpen이 false면 아무것도 렌더링하지 않는다', () => {
    const { container } = renderWithLikedUsers({ isOpen: false });
    expect(container).toBeEmptyDOMElement();
  });

  it('로딩 중이면 로딩 스피너를 보여준다', () => {
    renderWithLikedUsers({ isLoading: true });
    expect(screen.queryByText('좋아요한 사용자가 없습니다.')).not.toBeInTheDocument();
  });

  it('에러가 있으면 에러 메시지와 다시 시도 버튼을 보여주고, 클릭하면 refetch가 호출된다', () => {
    const refetch = jest.fn();
    renderWithLikedUsers({ errorMsg: '불러오지 못했습니다.', refetch });

    expect(screen.getByText('불러오지 못했습니다.')).toBeInTheDocument();

    fireEvent.click(screen.getByText('다시 시도'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('사용자가 없으면 빈 상태 메시지를 보여준다', () => {
    renderWithLikedUsers();
    expect(screen.getByText('좋아요한 사용자가 없습니다.')).toBeInTheDocument();
  });

  it('사용자 목록을 렌더링하고, 클릭하면 닫고 해당 프로필로 이동한다', () => {
    const close = jest.fn();
    renderWithLikedUsers({ users: [mockUser({ id: 'user-1', nickname: 'Alice' })], close });

    expect(screen.getByText('Alice')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Alice' }));

    expect(close).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/profile/user-1');
  });

  it('배경을 클릭하면 close가 호출된다', () => {
    const close = jest.fn();
    const { container } = renderWithLikedUsers({ close });

    fireEvent.mouseDown(container.firstElementChild as HTMLElement);

    expect(close).toHaveBeenCalledTimes(1);
  });

  it('패널 내부를 클릭해도 close가 호출되지 않는다', () => {
    const close = jest.fn();
    renderWithLikedUsers({ close });

    fireEvent.mouseDown(screen.getByText('좋아요'));

    expect(close).not.toHaveBeenCalled();
  });

  it('닫기 버튼을 클릭하면 close가 호출된다', () => {
    const close = jest.fn();
    renderWithLikedUsers({ close });

    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(close).toHaveBeenCalledTimes(1);
  });
});
