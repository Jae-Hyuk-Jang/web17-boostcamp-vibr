'use client';

import { useEffect, useState, type RefObject } from 'react';

type ScrollEdges = {
  /** 왼쪽으로 더 넘길 수 있다 */
  hasPrev: boolean;
  /** 오른쪽으로 더 넘길 수 있다 */
  hasNext: boolean;
};

/** 소수점 폭 때문에 끝에 닿았는데도 1px 미만이 남는 경우를 끝으로 본다 */
const EDGE_TOLERANCE_PX = 1;

const readEdges = (scroller: HTMLElement): ScrollEdges => ({
  hasPrev: scroller.scrollLeft > EDGE_TOLERANCE_PX,
  hasNext: scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - EDGE_TOLERANCE_PX,
});

/**
 * 가로 스크롤 영역이 양쪽으로 더 넘길 수 있는지. 좌우 버튼을 보이거나 끄는 데 쓴다.
 * 스크롤할 때, 보이는 폭(scrollerRef)이나 내용 폭(contentRef, 항목 추가 등)이 바뀔 때 다시 잰다.
 */
export function useHorizontalScrollEdges(scrollerRef: RefObject<HTMLElement | null>, contentRef: RefObject<HTMLElement | null>) {
  const [edges, setEdges] = useState<ScrollEdges>({ hasPrev: false, hasNext: false });

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const update = () => setEdges(readEdges(scroller));
    const frame = requestAnimationFrame(update);
    scroller.addEventListener('scroll', update, { passive: true });

    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(scroller);
    if (contentRef.current) observer?.observe(contentRef.current);

    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener('scroll', update);
      observer?.disconnect();
    };
  }, [scrollerRef, contentRef]);

  return edges;
}
