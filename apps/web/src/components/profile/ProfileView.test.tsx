import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { useInView } from 'react-intersection-observer';
import type { GetUserDto as Profile, PostPreviewDto as PostPreview } from '@repo/dto';

import ProfileView from './ProfileView';
import { useAuthStore, useFeedRefreshStore, useProfileStore } from '@/stores';
import { createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';

jest.mock('react-intersection-observer', () => ({
  useInView: jest.fn(),
}));

const mockUseInView = useInView as jest.Mock;

jest.mock('@/api', () => ({
  getUser: jest.fn(),
  getUserProfilePosts: jest.fn(),
}));

jest.mock('./ProfileInfo', () => ({
  ProfileInfo: () => <div data-testid="profile-info" />,
}));

jest.mock('./ProfilePosts', () => ({
  __esModule: true,
  default: ({ posts }: { posts: PostPreview[] }) => (
    <ul data-testid="profile-posts">
      {posts.map((p) => (
        <li key={p.postId}>{p.postId}</li>
      ))}
    </ul>
  ),
}));

const { getUser, getUserProfilePosts } = jest.requireMock('@/api') as { getUser: jest.Mock; getUserProfilePosts: jest.Mock };

const mockProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: 'user-1',
  nickname: 'user',
  profileImgUrl: null,
  bio: '',
  followerCount: 0,
  followingCount: 0,
  isFollowing: false,
  ...overrides,
});

const renderProfileView = (userId = 'user-1') => render(<ProfileView userId={userId} />, { wrapper: createQueryClientWrapper() });

describe('ProfileView — 무한스크롤/리프레시 특성화(#166)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: false });
    useAuthStore.setState({ userId: 'user-1', isAuthenticated: true, isLoading: false });
    useFeedRefreshStore.setState({ nonce: 0 });
    useProfileStore.setState({ profile: null });
  });

  it('초기 로드 시 프로필 정보와 게시글 목록을 렌더링한다', async () => {
    getUser.mockResolvedValue(mockProfile());
    getUserProfilePosts.mockResolvedValue({ items: [{ postId: 'a' }], hasNext: false, nextCursor: undefined });

    renderProfileView();

    await waitFor(() => expect(screen.getByTestId('profile-info')).toBeInTheDocument());
    expect(screen.getByTestId('profile-posts')).toHaveTextContent('a');
    expect(getUserProfilePosts).toHaveBeenCalledWith('user-1', undefined, undefined);
  });

  it('본인 프로필(isMyProfile)일 때만 useFeedRefreshStore.bump() 후 게시글을 재조회한다', async () => {
    getUser.mockResolvedValue(mockProfile());
    getUserProfilePosts.mockResolvedValueOnce({ items: [{ postId: 'a' }], hasNext: false, nextCursor: undefined });

    renderProfileView('user-1');
    await waitFor(() => expect(screen.getByTestId('profile-posts')).toHaveTextContent('a'));

    getUserProfilePosts.mockResolvedValueOnce({ items: [{ postId: 'x' }], hasNext: false, nextCursor: undefined });
    act(() => {
      useFeedRefreshStore.getState().bump();
    });

    await waitFor(() => expect(screen.getByTestId('profile-posts')).toHaveTextContent('x'), { timeout: 2000 });
    expect(getUserProfilePosts).toHaveBeenCalledTimes(2);
  });

  it('타인 프로필일 때는 useFeedRefreshStore.bump()가 재조회를 유발하지 않는다', async () => {
    useAuthStore.setState({ userId: 'me', isAuthenticated: true, isLoading: false });
    getUser.mockResolvedValue(mockProfile({ id: 'other-user' }));
    getUserProfilePosts.mockResolvedValue({ items: [{ postId: 'a' }], hasNext: false, nextCursor: undefined });

    renderProfileView('other-user');
    await waitFor(() => expect(screen.getByTestId('profile-posts')).toHaveTextContent('a'));

    act(() => {
      useFeedRefreshStore.getState().bump();
    });

    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(getUserProfilePosts).toHaveBeenCalledTimes(1);
  });

  it('무한스크롤 에러 발생 시 에러 메시지를 표시한다', async () => {
    getUser.mockResolvedValue(mockProfile());
    getUserProfilePosts.mockRejectedValue(new Error('network error'));

    renderProfileView();

    await waitFor(() => expect(screen.getByTestId('profile-info')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('오류가 발생했습니다.')).toBeInTheDocument());
  });
});
