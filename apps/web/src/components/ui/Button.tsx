import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const BASE_CLASSNAME =
  'inline-flex items-center justify-center gap-2 rounded-md font-bold transition-all enabled:hover:shadow-[2px_2px_0px_0px_#00ebc7] disabled:opacity-50 disabled:cursor-not-allowed';

const VARIANT_CLASSNAME: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white border-2 border-primary',
  secondary: 'border-2 border-primary text-primary hover:bg-white',
  danger: 'bg-accent-pink text-white border-2 border-primary',
};

const SIZE_CLASSNAME: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-6 py-2.5 text-base',
  icon: 'p-2',
};

/** docs/design-system.md §8의 Primary/Secondary/Danger 레시피를 구현한 공용 버튼. 색상/radius/hover는 variant·size로 고정하고, className은 소비처가 필요한 부분만 오버라이드하도록 병합한다(강제 통일 아님, docs/refactors/shared-component-duplication/adr.md 참고). */
export default function Button({ variant = 'primary', size = 'md', type = 'button', className = '', ...rest }: ButtonProps) {
  return <button type={type} className={`${BASE_CLASSNAME} ${VARIANT_CLASSNAME[variant]} ${SIZE_CLASSNAME[size]} ${className}`} {...rest} />;
}
