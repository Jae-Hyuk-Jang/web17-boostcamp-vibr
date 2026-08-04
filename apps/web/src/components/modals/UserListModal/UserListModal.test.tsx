import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useInView } from 'react-intersection-observer';
import type { GetUserFollowDto, UserWithFollowStatusDto } from '@repo/dto';

import { UserListModal } from './UserListModal';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { useAuthStore } from '@/stores';
import { profileQueryKey } from '@/hooks/profile/useProfile';
import { createTestQueryClient, createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';

jest.mock('react-intersection-observer', () => ({
  useInView: jest.fn(),
}));

const mockUseInView = useInView as jest.Mock;

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

jest.mock('@/components/profile', () => ({
  ProfileActionButton: ({ profileUserId, onFollowActionComplete }: { profileUserId: string; onFollowActionComplete: () => void }) => (
    <button data-testid={`follow-btn-${profileUserId}`} onClick={onFollowActionComplete}>
      follow
    </button>
  ),
}));

const mockUser = (overrides: Partial<UserWithFollowStatusDto> = {}): UserWithFollowStatusDto => ({
  id: 'user-a',
  nickname: 'userA',
  profileImgUrl: null,
  isFollowing: false,
  ...overrides,
});

const emptyFetchFn = jest.fn<Promise<GetUserFollowDto>, [string, string | undefined, number | undefined]>().mockResolvedValue({
  users: [],
  hasNext: false,
  nextCursor: undefined,
});

const renderModal = (fetchFn: jest.Mock = emptyFetchFn, profileUserId = 'user-1', queryClient = createTestQueryClient()) => {
  useModalStore.setState({ isOpen: true, modalType: MODAL_TYPES.FOLLOWER_USER, modalProps: { profileUserId } });
  return render(<UserListModal title="팔로워" fetchFn={fetchFn} />, { wrapper: createQueryClientWrapper(queryClient) });
};

describe('UserListModal — 배경 클릭/닫기 버튼 특성화 테스트 (#66)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: false });
    useAuthStore.setState({ userId: 'me', isAuthenticated: true, isLoading: false });
    emptyFetchFn.mockClear();
    emptyFetchFn.mockResolvedValue({ users: [], hasNext: false, nextCursor: undefined });
  });

  it('배경을 클릭하면 모달이 닫힌다', () => {
    // #68: 별도 overlay div가 ModalShell로 흡수되어, backdrop이 곧 role="dialog" 요소다.
    renderModal();

    fireEvent.mouseDown(screen.getByRole('dialog'));

    expect(useModalStore.getState().isOpen).toBe(false);
  });

  it('닫기 버튼을 클릭하면 모달이 닫힌다', () => {
    renderModal();

    fireEvent.click(screen.getByRole('button'));

    expect(useModalStore.getState().isOpen).toBe(false);
  });
});

describe('UserListModal — 무한스크롤/팔로우 토글 특성화(#166)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: false });
    useAuthStore.setState({ userId: 'me', isAuthenticated: true, isLoading: false });
  });

  it('초기 로드 시 목록을 렌더링한다', async () => {
    const fetchFn = jest.fn<Promise<GetUserFollowDto>, [string, string | undefined, number | undefined]>().mockResolvedValue({
      users: [mockUser({ id: 'user-a' })],
      hasNext: false,
      nextCursor: undefined,
    });

    renderModal(fetchFn, 'profile-owner');

    await waitFor(() => expect(screen.getByText('userA')).toBeInTheDocument());
    expect(fetchFn).toHaveBeenCalledWith('profile-owner', undefined);
  });

  it('팔로우 토글 완료 시 로컬 목록 항목의 isFollowing이 즉시 갱신된다(에러 없이 재렌더링됨)', async () => {
    const fetchFn = jest.fn<Promise<GetUserFollowDto>, [string, string | undefined, number | undefined]>().mockResolvedValue({
      users: [mockUser({ id: 'user-a', isFollowing: false })],
      hasNext: false,
      nextCursor: undefined,
    });

    renderModal(fetchFn);
    await waitFor(() => expect(screen.getByTestId('follow-btn-user-a')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('follow-btn-user-a'));

    expect(screen.getByTestId('follow-btn-user-a')).toBeInTheDocument();
  });

  it('내 프로필에서 팔로우 토글 시 profile 캐시(팔로잉 수)가 증가한다 (profile-info-caching #204)', async () => {
    useAuthStore.setState({ userId: 'my-id', isAuthenticated: true, isLoading: false });
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(profileQueryKey('my-id'), {
      id: 'my-id',
      nickname: 'me',
      profileImgUrl: null,
      bio: '',
      followerCount: 0,
      followingCount: 5,
      isFollowing: false,
    });

    const fetchFn = jest.fn<Promise<GetUserFollowDto>, [string, string | undefined, number | undefined]>().mockResolvedValue({
      users: [mockUser({ id: 'user-a', isFollowing: false })],
      hasNext: false,
      nextCursor: undefined,
    });

    renderModal(fetchFn, 'my-id', queryClient);
    await waitFor(() => expect(screen.getByTestId('follow-btn-user-a')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('follow-btn-user-a'));

    expect(queryClient.getQueryData<{ followingCount: number }>(profileQueryKey('my-id'))?.followingCount).toBe(6);
  });

  it('내 프로필이 아닌 목록에서 팔로우 토글해도 내 프로필 캐시에는 영향이 없다', async () => {
    useAuthStore.setState({ userId: 'my-id', isAuthenticated: true, isLoading: false });
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(profileQueryKey('my-id'), {
      id: 'my-id',
      nickname: 'me',
      profileImgUrl: null,
      bio: '',
      followerCount: 0,
      followingCount: 5,
      isFollowing: false,
    });

    const fetchFn = jest.fn<Promise<GetUserFollowDto>, [string, string | undefined, number | undefined]>().mockResolvedValue({
      users: [mockUser({ id: 'user-a', isFollowing: false })],
      hasNext: false,
      nextCursor: undefined,
    });

    renderModal(fetchFn, 'someone-elses-profile', queryClient);
    await waitFor(() => expect(screen.getByTestId('follow-btn-user-a')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('follow-btn-user-a'));

    expect(queryClient.getQueryData<{ followingCount: number }>(profileQueryKey('my-id'))?.followingCount).toBe(5);
  });

  it('에러 발생 시 에러 메시지를 표시한다', async () => {
    const fetchFn = jest.fn<Promise<GetUserFollowDto>, [string, string | undefined, number | undefined]>().mockRejectedValue(new Error('fail'));

    renderModal(fetchFn);

    await waitFor(() => expect(screen.getByText('오류가 발생했습니다.')).toBeInTheDocument());
  });

  it('목록이 비어있으면 안내 문구를 표시한다', async () => {
    renderModal();

    await waitFor(() => expect(screen.getByText('사용자가 없습니다.')).toBeInTheDocument());
  });
});
