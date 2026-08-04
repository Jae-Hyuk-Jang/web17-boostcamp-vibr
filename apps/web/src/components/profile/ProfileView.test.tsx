import { render, screen, waitFor } from '@testing-library/react';
import { act, Component, type ReactNode } from 'react';
import { useInView } from 'react-intersection-observer';
import type { GetUserDto as Profile, PostPreviewDto as PostPreview } from '@repo/dto';

import ProfileView from './ProfileView';
import { profileGridQueryKey } from '@/query-keys';
import { useAuthStore } from '@/stores';
import { createTestQueryClient, createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';

jest.mock('react-intersection-observer', () => ({
  useInView: jest.fn(),
}));

const mockUseInView = useInView as jest.Mock;

jest.mock('@/api', () => ({
  getUserProfilePosts: jest.fn(),
}));

// useProfile(#199)이 getUser를 '@/api/internal'에서 직접 가져오므로 별도로 모킹한다.
jest.mock('@/api/internal', () => ({
  getUser: jest.fn(),
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

const { getUserProfilePosts } = jest.requireMock('@/api') as { getUserProfilePosts: jest.Mock };
const { getUser } = jest.requireMock('@/api/internal') as { getUser: jest.Mock };

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

const renderProfileView = (userId = 'user-1', queryClient = createTestQueryClient()) =>
  render(<ProfileView userId={userId} />, { wrapper: createQueryClientWrapper(queryClient) });

class TestErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) return <div data-testid="error-boundary">{this.state.error.message}</div>;
    return this.props.children;
  }
}

describe('ProfileView — 무한스크롤/쿼리 무효화 특성화(#166)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: false });
    useAuthStore.setState({ userId: 'user-1', isAuthenticated: true, isLoading: false });
  });

  it('초기 로드 시 프로필 정보와 게시글 목록을 렌더링한다', async () => {
    getUser.mockResolvedValue(mockProfile());
    getUserProfilePosts.mockResolvedValue({ items: [{ postId: 'a' }], hasNext: false, nextCursor: undefined });

    renderProfileView();

    await waitFor(() => expect(screen.getByTestId('profile-info')).toBeInTheDocument());
    expect(screen.getByTestId('profile-posts')).toHaveTextContent('a');
    expect(getUserProfilePosts).toHaveBeenCalledWith('user-1', undefined);
  });

  it('profileGridQueryKey(userId)를 invalidateQueries하면 게시글을 재조회한다(글 작성 후 재조회 대체 메커니즘)', async () => {
    getUser.mockResolvedValue(mockProfile());
    getUserProfilePosts.mockResolvedValueOnce({ items: [{ postId: 'a' }], hasNext: false, nextCursor: undefined });

    const queryClient = createTestQueryClient();
    renderProfileView('user-1', queryClient);
    await waitFor(() => expect(screen.getByTestId('profile-posts')).toHaveTextContent('a'));

    getUserProfilePosts.mockResolvedValueOnce({ items: [{ postId: 'x' }], hasNext: false, nextCursor: undefined });
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: profileGridQueryKey('user-1') });
    });

    await waitFor(() => expect(screen.getByTestId('profile-posts')).toHaveTextContent('x'), { timeout: 2000 });
    expect(getUserProfilePosts).toHaveBeenCalledTimes(2);
  });

  it('다른 유저의 profileGridQueryKey를 invalidate해도 이 프로필에는 영향이 없다(쿼리키 자체가 사용자별로 격리됨)', async () => {
    getUser.mockResolvedValue(mockProfile());
    getUserProfilePosts.mockResolvedValue({ items: [{ postId: 'a' }], hasNext: false, nextCursor: undefined });

    const queryClient = createTestQueryClient();
    renderProfileView('user-1', queryClient);
    await waitFor(() => expect(screen.getByTestId('profile-posts')).toHaveTextContent('a'));

    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: profileGridQueryKey('other-user') });
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

  it('getUser 실패 시 에러를 throw해 에러 바운더리로 전파된다', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    getUser.mockRejectedValue(new Error('프로필 조회 실패'));
    getUserProfilePosts.mockResolvedValue({ items: [], hasNext: false, nextCursor: undefined });

    render(
      <TestErrorBoundary>
        <ProfileView userId="user-1" />
      </TestErrorBoundary>,
      { wrapper: createQueryClientWrapper() },
    );

    await waitFor(() => expect(screen.getByTestId('error-boundary')).toHaveTextContent('프로필 조회 실패'));
    consoleErrorSpy.mockRestore();
  });

  it('프로필 조회가 끝나기 전까지는 스켈레톤을 유지한다', async () => {
    let resolveGetUser: (p: Profile) => void = () => {};
    getUser.mockReturnValue(
      new Promise<Profile>((resolve) => {
        resolveGetUser = resolve;
      }),
    );
    getUserProfilePosts.mockResolvedValue({ items: [], hasNext: false, nextCursor: undefined });

    renderProfileView('user-1');

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-info')).not.toBeInTheDocument();

    await act(async () => {
      resolveGetUser(mockProfile({ id: 'user-1' }));
    });

    await waitFor(() => expect(screen.getByTestId('profile-info')).toBeInTheDocument());
  });

  it('다른 userId로 이동하면 새 캐시 키로 프로필을 다시 조회한다(캐시 격리)', async () => {
    getUser.mockImplementation((userId: string) => Promise.resolve(mockProfile({ id: userId, nickname: `nick-${userId}` })));
    getUserProfilePosts.mockResolvedValue({ items: [], hasNext: false, nextCursor: undefined });

    const queryClient = createTestQueryClient();
    const { rerender } = render(<ProfileView userId="user-1" />, { wrapper: createQueryClientWrapper(queryClient) });
    await waitFor(() => expect(screen.getByTestId('profile-info')).toBeInTheDocument());
    expect(getUser).toHaveBeenCalledWith('user-1');

    rerender(<ProfileView userId="user-2" />);

    await waitFor(() => expect(getUser).toHaveBeenCalledWith('user-2'));
  });
});
