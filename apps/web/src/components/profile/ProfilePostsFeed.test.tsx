import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useInView } from 'react-intersection-observer';
import type { MusicResponseDto, PostResponseDto as Post } from '@repo/dto';
import { MusicProvider } from '@repo/dto/values';

import ProfilePostsFeed from './ProfilePostsFeed';
import { postDetailQueryKey } from '@/query-keys';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { createTestQueryClient, createQueryClientWrapper } from '@/test-utils/QueryClientWrapper';

jest.mock('react-intersection-observer', () => ({
  useInView: jest.fn(),
}));

const mockUseInView = useInView as jest.Mock;

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

jest.mock('@/hooks/useIsMobile', () => ({
  __esModule: true,
  default: () => false,
}));

jest.mock('@/api', () => ({
  getUserProfilePosts: jest.fn(),
  getPostDetail: jest.fn(),
}));

jest.mock('@/components/post', () => ({
  PostCard: ({ post, onPlayAll }: { post: Post; onPlayAll: () => void }) => (
    <div data-testid={`post-${post.id}`}>
      {post.id}
      <button type="button" onClick={onPlayAll}>
        전체 재생 {post.id}
      </button>
    </div>
  ),
}));

const { getUserProfilePosts, getPostDetail } = jest.requireMock('@/api') as { getUserProfilePosts: jest.Mock; getPostDetail: jest.Mock };

const mockPost = (overrides: Partial<Post> = {}): Post => ({
  id: 'post-1',
  author: { id: 'author-1', nickname: 'author', profileImgUrl: null },
  playlist: { id: 'playlist-test', title: '테스트 플레이리스트', coverImageUrls: [], tracksCount: 0 },
  coverImgUrl: '',
  musics: [],
  content: 'content',
  likeCount: 0,
  commentCount: 0,
  createdAt: new Date().toISOString(),
  isEdited: false,
  isLiked: false,
  ...overrides,
});

describe('ProfilePostsFeed — N+1 상세조회 + 캐시 시딩 특성화(#166)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: false });
  });

  it('프리뷰 목록을 N+1 상세조회해 전체 게시글로 렌더링하고, 각 게시글을 postDetailQueryKey 캐시에 시딩한다', async () => {
    const queryClient = createTestQueryClient();
    getUserProfilePosts.mockResolvedValue({ items: [{ postId: 'a' }, { postId: 'b' }], hasNext: false, nextCursor: undefined });
    getPostDetail.mockImplementation(async (postId: string) => mockPost({ id: postId }));

    render(<ProfilePostsFeed userId="user-1" />, { wrapper: createQueryClientWrapper(queryClient) });

    await waitFor(() => expect(screen.getByTestId('post-a')).toBeInTheDocument());
    expect(screen.getByTestId('post-b')).toBeInTheDocument();

    expect(getPostDetail).toHaveBeenCalledWith('a');
    expect(getPostDetail).toHaveBeenCalledWith('b');
    expect(queryClient.getQueryData(postDetailQueryKey('a'))).toMatchObject({ id: 'a' });
    expect(queryClient.getQueryData(postDetailQueryKey('b'))).toMatchObject({ id: 'b' });
  });

  it('게시글의 전체 재생은 그 곡 목록으로 playAll을 부른다', async () => {
    const initialPlayerState = usePlayerStore.getState();
    const playAll = jest.fn();
    usePlayerStore.setState({ playAll });
    const musics: MusicResponseDto[] = [
      { id: 'm1', title: '곡', artistName: '가수', albumCoverUrl: 'c', trackUri: 'u', provider: MusicProvider.ITUNES, durationMs: 1 },
    ];
    getUserProfilePosts.mockResolvedValue({ items: [{ postId: 'a' }], hasNext: false, nextCursor: undefined });
    getPostDetail.mockResolvedValue(mockPost({ id: 'a', musics }));

    render(<ProfilePostsFeed userId="user-1" />, { wrapper: createQueryClientWrapper(createTestQueryClient()) });
    fireEvent.click(await screen.findByRole('button', { name: '전체 재생 a' }));

    expect(playAll).toHaveBeenCalledWith(musics);
    usePlayerStore.setState(initialPlayerState, true);
  });

  it('에러 발생 시 에러 메시지를 표시한다', async () => {
    getUserProfilePosts.mockRejectedValue(new Error('network error'));

    render(<ProfilePostsFeed userId="user-1" />, { wrapper: createQueryClientWrapper() });

    await waitFor(() => expect(screen.getByText('오류가 발생했습니다.')).toBeInTheDocument());
  });
});
