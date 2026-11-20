import { render, screen } from '@testing-library/react';
import PlaylistCover from './PlaylistCover';

const urls = (count: number) => Array.from({ length: count }, (_, i) => `https://is1-ssl.mzstatic.com/${i}.jpg`);

describe('PlaylistCover — 커버 이미지 개수대로 그린다', () => {
  it('이미지가 없으면 기본 커버를 그린다', () => {
    const { container } = render(<PlaylistCover title="빈 플리" coverImageUrls={[]} sizes="100px" />);

    expect(screen.getByRole('img', { name: '빈 플리 기본 커버' })).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });

  it('같은 제목이면 기본 커버 색이 같다', () => {
    const { container: first } = render(<PlaylistCover title="비 오는 날" coverImageUrls={[]} sizes="100px" />);
    const { container: second } = render(<PlaylistCover title="비 오는 날" coverImageUrls={[]} sizes="100px" />);

    expect(first.firstElementChild!.className).toBe(second.firstElementChild!.className);
  });

  it('이미지가 하나면 한 장을 그린다', () => {
    const { container } = render(<PlaylistCover title="한 장" coverImageUrls={urls(1)} sizes="100px" />);

    expect(screen.getByAltText('한 장 커버')).toBeInTheDocument();
    expect(container.querySelectorAll('img')).toHaveLength(1);
  });

  it('이미지가 넷이면 2×2로 네 장을 그린다', () => {
    const { container } = render(<PlaylistCover title="모자이크" coverImageUrls={urls(4)} sizes="100px" />);

    expect(screen.getByRole('img', { name: '모자이크 커버' })).toHaveClass('grid-cols-2');
    expect(container.querySelectorAll('img')).toHaveLength(4);
  });
});
