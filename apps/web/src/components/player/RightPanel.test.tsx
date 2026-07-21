import { render, screen, fireEvent, act } from '@testing-library/react';

import RightPanel from './RightPanel';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useAuthStore } from '@/stores/useAuthStore';
import type { MusicResponseDto as Music } from '@repo/dto';

const mockMusic: Music = {
  id: 'm1',
  trackUri: 'uri-1',
  provider: 'ITUNES' as Music['provider'],
  albumCoverUrl: 'https://example.com/a.jpg',
  title: 'Test Song',
  artistName: 'Test Artist',
  durationMs: 200000,
};

describe('RightPanel — 풀플레이어 오버레이 열기/닫기 특성화 테스트 (mobile-queue-view-duplication #119)', () => {
  beforeEach(() => {
    useAuthStore.setState({ isAuthenticated: false, isLoading: true, userId: null });
    usePlayerStore.setState({ queue: [], currentMusic: mockMusic, isPlaying: false });
  });

  it('앨범아트/곡정보 영역을 클릭하면 풀플레이어 오버레이가 열린다', () => {
    render(<RightPanel />);

    expect(screen.queryByTitle('닫기')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Test Song/ }));

    expect(screen.getByTitle('닫기')).toBeInTheDocument();
  });

  it('X 버튼을 클릭하면 풀플레이어 오버레이가 닫힌다', () => {
    render(<RightPanel />);
    fireEvent.click(screen.getByRole('button', { name: /Test Song/ }));

    fireEvent.click(screen.getByTitle('닫기'));

    expect(screen.queryByTitle('닫기')).not.toBeInTheDocument();
  });

  it('ESC 키를 누르면 풀플레이어 오버레이가 닫힌다', () => {
    render(<RightPanel />);
    fireEvent.click(screen.getByRole('button', { name: /Test Song/ }));

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByTitle('닫기')).not.toBeInTheDocument();
  });

  it('뒤로가기(popstate)를 하면 풀플레이어 오버레이가 닫힌다', () => {
    render(<RightPanel />);
    fireEvent.click(screen.getByRole('button', { name: /Test Song/ }));

    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(screen.queryByTitle('닫기')).not.toBeInTheDocument();
  });

  // 스와이프다운 닫기(handleTouchMove)는 jsdom의 TouchEvent 시뮬레이션 한계로
  // 자동화 테스트에서 안정적으로 재현하지 못했다 — X 버튼/ESC/뒤로가기로 닫히는
  // 경로는 위에서 이미 검증했고, 스와이프는 result.md에 수동 확인 필요로 남긴다.

  it('데스크탑 상시 패널에는 재생목록이 QueueList로 렌더링된다', () => {
    render(<RightPanel />);

    expect(screen.getByText('재생 목록')).toBeInTheDocument();
  });

  it('ListPlus 버튼을 클릭하면 풀플레이어가 열리고 재생목록 위치로 스크롤한다 (#120)', () => {
    const scrollIntoViewMock = jest.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;

    render(<RightPanel />);

    fireEvent.click(screen.getByTitle('현재 재생목록 열기'));

    expect(screen.getByTitle('닫기')).toBeInTheDocument();
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ block: 'start' });
  });

  it('앨범아트 탭으로 열었을 때는 스크롤하지 않는다 (#120)', () => {
    const scrollIntoViewMock = jest.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;

    render(<RightPanel />);

    fireEvent.click(screen.getByRole('button', { name: /Test Song/ }));

    expect(screen.getByTitle('닫기')).toBeInTheDocument();
    expect(scrollIntoViewMock).not.toHaveBeenCalled();
  });
});
