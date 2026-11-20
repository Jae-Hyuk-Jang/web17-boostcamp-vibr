import Image from 'next/image';
import { Music } from 'lucide-react';
import { PLAYLIST_COVER_MOSAIC_COUNT } from '@repo/dto/values';

interface PlaylistCoverProps {
  title: string;
  /** 서버가 커버 규칙으로 고른 이미지 0·1·4개 */
  coverImageUrls: string[];
  /** next/image sizes. 커버가 화면에서 차지하는 폭 */
  sizes: string;
  className?: string;
}

/** 곡이 없을 때 쓰는 기본 커버 색. 같은 제목은 늘 같은 색이 되도록 제목으로 고른다 */
const DEFAULT_COVER_GRADIENTS = [
  'from-accent-pink to-accent-yellow',
  'from-accent-cyan to-primary',
  'from-primary to-accent-pink',
  'from-accent-yellow to-accent-cyan',
] as const;

const pickGradient = (title: string) => {
  const hash = [...title].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 0);
  return DEFAULT_COVER_GRADIENTS[hash % DEFAULT_COVER_GRADIENTS.length];
};

/**
 * 플레이리스트 커버. 이미지 개수대로 그린다.
 * 0개: 기본 커버, 1개: 한 장, 4개: 2×2(합친 이미지를 만들지 않고 화면에서 배치)
 */
export default function PlaylistCover({ title, coverImageUrls, sizes, className = '' }: PlaylistCoverProps) {
  const frameClassName = `relative aspect-square w-full overflow-hidden bg-gray-100 ${className}`;

  if (coverImageUrls.length === 0) {
    return (
      <div
        role="img"
        aria-label={`${title} 기본 커버`}
        className={`${frameClassName} flex items-center justify-center bg-linear-to-br ${pickGradient(title)}`}
      >
        <Music aria-hidden className="w-1/3 h-1/3 text-white/90" strokeWidth={2.5} />
      </div>
    );
  }

  // 서버는 0·1·4개만 보내지만, 모자이크에 모자라면 첫 장만 그린다
  const isMosaic = coverImageUrls.length >= PLAYLIST_COVER_MOSAIC_COUNT;
  if (!isMosaic) {
    return (
      <div className={frameClassName}>
        <Image src={coverImageUrls[0]!} alt={`${title} 커버`} fill sizes={sizes} className="object-cover" />
      </div>
    );
  }

  // 2×2 격자. PLAYLIST_COVER_MOSAIC_COUNT(4)를 바꾸면 격자 크기도 함께 바꾼다
  return (
    <div role="img" aria-label={`${title} 커버`} className={`${frameClassName} grid grid-cols-2 grid-rows-2`}>
      {coverImageUrls.slice(0, PLAYLIST_COVER_MOSAIC_COUNT).map((url, index) => (
        <div key={`${url}-${index}`} className="relative">
          <Image src={url} alt="" fill sizes={`calc((${sizes}) / 2)`} className="object-cover" />
        </div>
      ))}
    </div>
  );
}
