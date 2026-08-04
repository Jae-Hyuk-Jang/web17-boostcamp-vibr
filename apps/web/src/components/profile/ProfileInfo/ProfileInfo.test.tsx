import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { GetUserDto as Profile } from '@repo/dto';

import ProfileInfo from './ProfileInfo';
import { profileQueryKey } from '@/query-keys';
import { createTestQueryClient, createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';

jest.mock('@/api', () => ({
  updateProfile: jest.fn(),
}));

jest.mock('./ProfileActionButton', () => ({
  __esModule: true,
  default: ({ onFollowActionComplete }: { onFollowActionComplete: () => void }) => (
    <button data-testid="follow-action" onClick={onFollowActionComplete}>
      follow-action
    </button>
  ),
}));

const { updateProfile } = jest.requireMock('@/api') as { updateProfile: jest.Mock };

const mockProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: 'user-1',
  nickname: '닉네임',
  profileImgUrl: null,
  bio: '소개글',
  followerCount: 3,
  followingCount: 5,
  isFollowing: false,
  ...overrides,
});

const renderProfileInfo = (props: Partial<React.ComponentProps<typeof ProfileInfo>> = {}, queryClient = createTestQueryClient()) =>
  render(<ProfileInfo profile={mockProfile()} loggedInUserId="user-1" {...props} />, { wrapper: createQueryClientWrapper(queryClient) });

describe('ProfileInfo — 특성화 테스트 (profile-info-caching #198)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('내 프로필이 아니면 수정 버튼을 보여주지 않는다', () => {
    renderProfileInfo({ loggedInUserId: 'other-user' });

    expect(screen.queryByLabelText('프로필 수정')).not.toBeInTheDocument();
  });

  it('내 프로필이면 수정 버튼을 눌러 편집 모드로 들어갈 수 있다', () => {
    renderProfileInfo();

    fireEvent.click(screen.getByLabelText('프로필 수정'));

    expect(screen.getByDisplayValue('닉네임')).toBeInTheDocument();
    expect(screen.getByLabelText('저장')).toBeInTheDocument();
    expect(screen.getByLabelText('취소')).toBeInTheDocument();
  });

  it('저장하면 updateProfile API를 호출한 뒤 profile 캐시를 갱신하고 편집 모드를 종료한다 (profile-info-caching #202)', async () => {
    // 실제 PATCH /user 응답은 갱신된 Profile 전체가 아니라 { success: true }뿐이다(apps/api UserService.updateUser 확인,
    // 브라우저 실동작 검증에서 발견) — 응답 본문이 아니라 저장을 요청한 값(variables)이 캐시에 반영돼야 한다.
    updateProfile.mockResolvedValue({ success: true });
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(profileQueryKey('user-1'), mockProfile());

    renderProfileInfo({}, queryClient);

    fireEvent.click(screen.getByLabelText('프로필 수정'));
    fireEvent.change(screen.getByDisplayValue('닉네임'), { target: { value: '새 닉네임' } });
    fireEvent.click(screen.getByLabelText('저장'));

    await waitFor(() => expect(updateProfile).toHaveBeenCalledWith({ nickname: '새 닉네임', bio: '소개글' }));
    await waitFor(() => expect(queryClient.getQueryData(profileQueryKey('user-1'))).toEqual(mockProfile({ nickname: '새 닉네임', bio: '소개글' })));
    expect(screen.queryByLabelText('저장')).not.toBeInTheDocument();
  });

  it('취소하면 편집 모드를 종료하고 updateProfile을 호출하지 않는다', () => {
    renderProfileInfo();

    fireEvent.click(screen.getByLabelText('프로필 수정'));
    fireEvent.change(screen.getByDisplayValue('닉네임'), { target: { value: '바뀔 뻔한 닉네임' } });
    fireEvent.click(screen.getByLabelText('취소'));

    expect(updateProfile).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('저장')).not.toBeInTheDocument();
  });

  it('ProfileActionButton의 onFollowActionComplete 완료 시 profile 캐시의 isFollowing/followerCount가 갱신된다 (profile-info-caching #203)', () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(profileQueryKey('user-1'), mockProfile({ isFollowing: false, followerCount: 3 }));

    renderProfileInfo({ loggedInUserId: 'other-user' }, queryClient);

    fireEvent.click(screen.getByTestId('follow-action'));

    expect(queryClient.getQueryData(profileQueryKey('user-1'))).toMatchObject({ isFollowing: true, followerCount: 4 });
  });
});
