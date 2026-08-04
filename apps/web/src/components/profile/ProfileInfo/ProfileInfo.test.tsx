import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { GetUserDto as Profile } from '@repo/dto';

import ProfileInfo from './ProfileInfo';
import { useProfileStore } from '@/stores';

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

describe('ProfileInfo — 특성화 테스트 (profile-info-caching #198)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useProfileStore.setState({ profile: null });
  });

  it('내 프로필이 아니면 수정 버튼을 보여주지 않는다', () => {
    render(<ProfileInfo profile={mockProfile()} loggedInUserId="other-user" />);

    expect(screen.queryByLabelText('프로필 수정')).not.toBeInTheDocument();
  });

  it('내 프로필이면 수정 버튼을 눌러 편집 모드로 들어갈 수 있다', () => {
    render(<ProfileInfo profile={mockProfile()} loggedInUserId="user-1" />);

    fireEvent.click(screen.getByLabelText('프로필 수정'));

    expect(screen.getByDisplayValue('닉네임')).toBeInTheDocument();
    expect(screen.getByLabelText('저장')).toBeInTheDocument();
    expect(screen.getByLabelText('취소')).toBeInTheDocument();
  });

  it('저장하면 updateProfile API를 호출한 뒤 전역 프로필 상태를 갱신하고 편집 모드를 종료한다', async () => {
    updateProfile.mockResolvedValue(undefined);
    useProfileStore.setState({ profile: mockProfile() });
    render(<ProfileInfo profile={mockProfile()} loggedInUserId="user-1" />);

    fireEvent.click(screen.getByLabelText('프로필 수정'));
    fireEvent.change(screen.getByDisplayValue('닉네임'), { target: { value: '새 닉네임' } });
    fireEvent.click(screen.getByLabelText('저장'));

    await waitFor(() => expect(updateProfile).toHaveBeenCalledWith({ nickname: '새 닉네임', bio: '소개글' }));
    await waitFor(() => expect(useProfileStore.getState().profile?.nickname).toBe('새 닉네임'));
    expect(screen.queryByLabelText('저장')).not.toBeInTheDocument();
  });

  it('취소하면 편집 모드를 종료하고 updateProfile을 호출하지 않는다', () => {
    render(<ProfileInfo profile={mockProfile()} loggedInUserId="user-1" />);

    fireEvent.click(screen.getByLabelText('프로필 수정'));
    fireEvent.change(screen.getByDisplayValue('닉네임'), { target: { value: '바뀔 뻔한 닉네임' } });
    fireEvent.click(screen.getByLabelText('취소'));

    expect(updateProfile).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('저장')).not.toBeInTheDocument();
  });

  it('ProfileActionButton의 onFollowActionComplete로 useProfileStore.toggleFollow가 그대로 전달된다', () => {
    useProfileStore.setState({ profile: mockProfile({ isFollowing: false, followerCount: 3 }) });
    render(<ProfileInfo profile={mockProfile()} loggedInUserId="other-user" />);

    fireEvent.click(screen.getByTestId('follow-action'));

    expect(useProfileStore.getState().profile).toMatchObject({ isFollowing: true, followerCount: 4 });
  });
});
