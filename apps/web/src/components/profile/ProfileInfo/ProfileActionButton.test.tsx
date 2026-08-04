import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import ProfileActionButton from './ProfileActionButton';

jest.mock('react-toastify', () => ({
  toast: { error: jest.fn() },
}));

jest.mock('@/api', () => ({
  addFollow: jest.fn(),
  removeFollow: jest.fn(),
}));

const { addFollow, removeFollow } = jest.requireMock('@/api') as { addFollow: jest.Mock; removeFollow: jest.Mock };
const { toast } = jest.requireMock('react-toastify') as { toast: { error: jest.Mock } };

describe('ProfileActionButton — 특성화 테스트 (profile-info-caching #198)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('내 프로필이면(renderIn="page") Recap 버튼을 보여준다', () => {
    render(<ProfileActionButton loggedInUserId="me" profileUserId="me" isFollowing={false} renderIn="page" onFollowActionComplete={jest.fn()} />);

    expect(screen.getByTitle('프로필 리캡 생성')).toBeInTheDocument();
    expect(screen.queryByText('팔로우')).not.toBeInTheDocument();
  });

  it('내 프로필이면(renderIn="modal") 아무것도 렌더링하지 않는다', () => {
    const { container } = render(
      <ProfileActionButton loggedInUserId="me" profileUserId="me" isFollowing={false} renderIn="modal" onFollowActionComplete={jest.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('팔로우 중이 아니면 [팔로우] 버튼을 누르면 addFollow를 호출하고 성공 시 onFollowActionComplete를 호출한다', async () => {
    addFollow.mockResolvedValue(undefined);
    const onFollowActionComplete = jest.fn();

    render(
      <ProfileActionButton
        loggedInUserId="me"
        profileUserId="other"
        isFollowing={false}
        renderIn="page"
        onFollowActionComplete={onFollowActionComplete}
      />,
    );

    fireEvent.click(screen.getByText('팔로우'));

    await waitFor(() => expect(addFollow).toHaveBeenCalledWith('other'));
    await waitFor(() => expect(onFollowActionComplete).toHaveBeenCalledTimes(1));
    expect(removeFollow).not.toHaveBeenCalled();
  });

  it('팔로우 중이면 [팔로잉] 버튼을 누르면 removeFollow를 호출하고 성공 시 onFollowActionComplete를 호출한다', async () => {
    removeFollow.mockResolvedValue(undefined);
    const onFollowActionComplete = jest.fn();

    render(
      <ProfileActionButton
        loggedInUserId="me"
        profileUserId="other"
        isFollowing={true}
        renderIn="page"
        onFollowActionComplete={onFollowActionComplete}
      />,
    );

    fireEvent.click(screen.getByText('팔로잉'));

    await waitFor(() => expect(removeFollow).toHaveBeenCalledWith('other'));
    await waitFor(() => expect(onFollowActionComplete).toHaveBeenCalledTimes(1));
  });

  it('요청 실패 시 에러 toast를 띄우고 onFollowActionComplete는 호출하지 않는다', async () => {
    addFollow.mockRejectedValue(new Error('fail'));
    const onFollowActionComplete = jest.fn();

    render(
      <ProfileActionButton
        loggedInUserId="me"
        profileUserId="other"
        isFollowing={false}
        renderIn="page"
        onFollowActionComplete={onFollowActionComplete}
      />,
    );

    fireEvent.click(screen.getByText('팔로우'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('요청 처리에 실패했습니다.'));
    expect(onFollowActionComplete).not.toHaveBeenCalled();
  });

  it('요청 처리 중에는 버튼이 disabled 상태(로딩 표시)가 된다', async () => {
    let resolveAddFollow: () => void = () => {};
    addFollow.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveAddFollow = resolve;
      }),
    );

    render(<ProfileActionButton loggedInUserId="me" profileUserId="other" isFollowing={false} renderIn="page" onFollowActionComplete={jest.fn()} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => expect(button).toBeDisabled());

    resolveAddFollow();
    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it('로그인하지 않은 경우 버튼이 disabled 상태다', () => {
    render(
      <ProfileActionButton loggedInUserId={null} profileUserId="other" isFollowing={false} renderIn="page" onFollowActionComplete={jest.fn()} />,
    );

    expect(screen.getByRole('button')).toBeDisabled();
  });
});
