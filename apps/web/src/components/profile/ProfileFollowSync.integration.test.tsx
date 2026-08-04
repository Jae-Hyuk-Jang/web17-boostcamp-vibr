import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useInView } from 'react-intersection-observer';
import type { GetUserFollowDto, UserWithFollowStatusDto } from '@repo/dto';

import ProfileView from './ProfileView';
import { UserListModal } from '@/components/modals/UserListModal/UserListModal';
import { useModalStore, MODAL_TYPES } from '@/stores';
import { seedAuthMe } from '@/test-utils/authMeTestUtils';
import { createTestQueryClient, createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';

jest.mock('react-intersection-observer', () => ({
  useInView: jest.fn(),
}));

const mockUseInView = useInView as jest.Mock;

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

jest.mock('@/api', () => ({
  getUserProfilePosts: jest.fn(),
  addFollow: jest.fn(),
  removeFollow: jest.fn(),
}));

jest.mock('@/api/internal', () => ({
  getUser: jest.fn(),
}));

const { getUserProfilePosts, addFollow } = jest.requireMock('@/api') as {
  getUserProfilePosts: jest.Mock;
  addFollow: jest.Mock;
};
const { getUser } = jest.requireMock('@/api/internal') as { getUser: jest.Mock };

const myProfile = {
  id: 'my-id',
  nickname: '나',
  profileImgUrl: null,
  bio: '',
  followerCount: 0,
  followingCount: 5,
  isFollowing: false,
};

const followingListFetchFn = jest.fn<Promise<GetUserFollowDto>, [string, string | undefined, number | undefined]>();

const mockListUser = (overrides: Partial<UserWithFollowStatusDto> = {}): UserWithFollowStatusDto => ({
  id: 'other-user',
  nickname: '다른유저',
  profileImgUrl: null,
  isFollowing: false,
  ...overrides,
});

describe('프로필 쓰기 전파 통합 테스트 — UserListModal ↔ ProfileView (profile-info-caching #206, Success Criteria)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: false });
    useModalStore.setState({ isOpen: true, modalType: MODAL_TYPES.FOLLOWING_USER, modalProps: { profileUserId: 'my-id' } });
    getUser.mockResolvedValue(myProfile);
    getUserProfilePosts.mockResolvedValue({ items: [], hasNext: false, nextCursor: undefined });
    followingListFetchFn.mockResolvedValue({ users: [mockListUser({ isFollowing: false })], hasNext: false, nextCursor: undefined });
  });

  it('UserListModal에서 내 프로필을 대상으로 팔로우하면, 같은 화면의 ProfileView 팔로잉 수가 즉시 갱신된다', async () => {
    const queryClient = createTestQueryClient();
    seedAuthMe(queryClient, { userId: 'my-id', isAuthenticated: true });
    addFollow.mockResolvedValue(undefined);

    render(
      <>
        <ProfileView userId="my-id" />
        <UserListModal title="팔로잉" fetchFn={followingListFetchFn} />
      </>,
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    await waitFor(() => expect(screen.getByText('5')).toBeInTheDocument());

    fireEvent.click(screen.getByTitle('팔로우'));

    await waitFor(() => expect(addFollow).toHaveBeenCalledWith('other-user'));
    await waitFor(() => expect(screen.getByText('6')).toBeInTheDocument());
    expect(screen.queryByText('5')).not.toBeInTheDocument();
  });
});
