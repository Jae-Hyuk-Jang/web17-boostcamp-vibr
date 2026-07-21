import type { ReactNode } from 'react';

export interface ModalPanelProps {
  className?: string;
  children: ReactNode;
}

/** ModalShell이 backdrop·닫기 판정을 캡슐화한다면, ModalPanel은 그 안의 흰색 패널 뼈대(배경·테두리·radius)만 캡슐화한다. 크기·그림자·애니메이션은 className으로 각 모달이 그대로 소유한다. */
export default function ModalPanel({ className = '', children }: ModalPanelProps) {
  return <div className={`bg-white border-2 border-primary rounded-3xl overflow-hidden flex flex-col ${className}`}>{children}</div>;
}
