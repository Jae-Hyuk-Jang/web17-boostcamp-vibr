import { act, fireEvent, render, screen } from '@testing-library/react';
import HorizontalScroller from './HorizontalScroller';

/** jsdom은 레이아웃을 계산하지 않으므로 스크롤 영역 크기를 직접 정한다 */
const mockScrollGeometry = ({ scrollWidth, clientWidth }: { scrollWidth: number; clientWidth: number }) => {
  jest.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(scrollWidth);
  jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(clientWidth);
};

const flushAnimationFrame = () => act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));

const renderScroller = () =>
  render(
    <HorizontalScroller label="지금 인기" heading={<h2>지금 인기</h2>}>
      <div>카드</div>
    </HorizontalScroller>,
  );

describe('HorizontalScroller — 좌우 버튼', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('넘길 내용이 없으면 버튼을 보이지 않는다', async () => {
    mockScrollGeometry({ scrollWidth: 300, clientWidth: 300 });

    renderScroller();
    await flushAnimationFrame();

    expect(screen.queryByRole('button', { name: '지금 인기 다음' })).not.toBeInTheDocument();
  });

  it('처음에는 다음만 켜지고, 끝까지 넘기면 이전만 켜진다', async () => {
    mockScrollGeometry({ scrollWidth: 1000, clientWidth: 300 });

    const { container } = renderScroller();
    await flushAnimationFrame();

    expect(screen.getByRole('button', { name: '지금 인기 이전' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '지금 인기 다음' })).toBeEnabled();

    const scroller = container.querySelector('.overflow-x-auto')!;
    act(() => {
      scroller.scrollLeft = 700;
      fireEvent.scroll(scroller);
    });

    expect(screen.getByRole('button', { name: '지금 인기 이전' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '지금 인기 다음' })).toBeDisabled();
  });
});
