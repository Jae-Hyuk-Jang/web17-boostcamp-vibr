'use client';

import { useRef, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useHorizontalScrollEdges } from '@/hooks';

interface HorizontalScrollerProps {
  /** 줄 위 왼쪽에 놓을 제목 */
  heading: ReactNode;
  /** 좌우 버튼의 접근성 이름 앞에 붙일 이 줄의 이름(예: "지금 인기" → "지금 인기 다음") */
  label: string;
  /** 가로로 늘어놓을 항목. 항목에 snap-start를 주면 넘길 때 항목 단위로 멈춘다 */
  children: ReactNode;
}

/** 좌우 버튼으로 한 번에 넘기는 양(보이는 폭 대비) */
const SCROLL_STEP_RATIO = 0.8;

const SCROLL_BUTTON_CLASS_NAME =
  'flex size-9 items-center justify-center rounded-full border-2 border-primary bg-white transition-colors enabled:hover:bg-accent-cyan disabled:opacity-30';

/**
 * 제목과 가로로 넘기는 항목 줄. 모바일은 밀어서, 데스크톱은 좌우 버튼으로도 넘긴다.
 * 버튼은 넘길 수 있을 때만 보이고, 끝에 닿은 쪽은 꺼진다.
 */
export default function HorizontalScroller({ heading, label, children }: HorizontalScrollerProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { hasPrev, hasNext } = useHorizontalScrollEdges(scrollerRef, contentRef);
  const isScrollable = hasPrev || hasNext;

  const handleScroll = (direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollBy({ left: direction * scroller.clientWidth * SCROLL_STEP_RATIO, behavior: 'smooth' });
  };

  return (
    <>
      <div className="mb-3 flex items-center justify-between px-4 md:px-8">
        {heading}
        {isScrollable && (
          <div className="hidden lg:flex gap-2">
            <button
              type="button"
              onClick={() => handleScroll(-1)}
              disabled={!hasPrev}
              aria-label={`${label} 이전`}
              className={SCROLL_BUTTON_CLASS_NAME}
            >
              <ChevronLeft aria-hidden className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll(1)}
              disabled={!hasNext}
              aria-label={`${label} 다음`}
              className={SCROLL_BUTTON_CLASS_NAME}
            >
              <ChevronRight aria-hidden className="size-5" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={scrollerRef}
        className="snap-x snap-mandatory overflow-x-auto scroll-px-4 md:scroll-px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div ref={contentRef} className="flex w-max gap-4 px-4 md:px-8 pt-1 pb-3">
          {children}
        </div>
      </div>
    </>
  );
}
