import type { ButtonHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

import { BUTTON_DISABLED_CLASSNAME } from '@/constants';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const BASE_CLASSNAME = `inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all ${BUTTON_DISABLED_CLASSNAME}`;

const VARIANT_CLASSNAME: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white border-2 border-primary hover:bg-white hover:text-primary',
  secondary: 'border-2 border-primary text-primary hover:bg-white',
  danger: 'bg-accent-pink text-white border-2 border-primary',
};

const SIZE_CLASSNAME: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-6 py-2.5 text-base',
  icon: 'p-2',
};

/** docs/design-system.md §8의 Primary/Secondary/Danger 레시피를 구현한 공용 버튼. 색상/radius/hover는 variant·size로 고정하고, className은 소비처가 필요한 부분만 오버라이드하도록 병합한다(강제 통일 아님, docs/refactors/shared-component-duplication/adr.md 참고).
 *
 * className 병합에 twMerge를 쓰는 이유: 같은 속성(예: rounded-full vs rounded-md)을 겨냥한 클래스가
 * 동시에 있으면 단순 문자열 이어붙이기는 어느 쪽이 이길지 예측할 수 없다(Tailwind 내부 유틸리티
 * 등록 순서에 좌우되며 JSX 문자열 순서와 무관함을 컴파일된 CSS로 확인). twMerge는 항상 나중 클래스가
 * 이기도록 보장한다. */
export default function Button({ variant = 'primary', size = 'md', type = 'button', className = '', ...rest }: ButtonProps) {
  return <button type={type} className={twMerge(BASE_CLASSNAME, VARIANT_CLASSNAME[variant], SIZE_CLASSNAME[size], className)} {...rest} />;
}
