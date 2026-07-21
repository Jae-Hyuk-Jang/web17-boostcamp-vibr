import { render, screen, fireEvent } from '@testing-library/react';

import Button from './Button';

describe('Button', () => {
  it('기본값은 variant="primary" size="md" type="button"이다', () => {
    render(<Button>등록</Button>);

    const button = screen.getByRole('button', { name: '등록' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('bg-primary', 'text-white', 'px-6', 'py-2.5');
  });

  it('variant="secondary"는 outline 스타일을 적용한다', () => {
    render(<Button variant="secondary">취소</Button>);

    expect(screen.getByRole('button', { name: '취소' })).toHaveClass('border-2', 'border-primary', 'text-primary');
  });

  it('variant="danger"는 accent 스타일을 적용한다', () => {
    render(<Button variant="danger">삭제</Button>);

    expect(screen.getByRole('button', { name: '삭제' })).toHaveClass('bg-accent-pink', 'text-white');
  });

  it('size="icon"은 아이콘 전용 padding을 적용한다', () => {
    render(<Button size="icon" aria-label="닫기" />);

    expect(screen.getByRole('button', { name: '닫기' })).toHaveClass('p-2');
  });

  it('전달받은 className이 기본 클래스와 함께 병합된다', () => {
    render(<Button className="w-full">저장</Button>);

    const button = screen.getByRole('button', { name: '저장' });
    expect(button).toHaveClass('bg-primary', 'w-full');
  });

  it('className이 같은 속성을 겨냥한 기본 클래스를 안전하게 오버라이드한다(twMerge)', () => {
    render(<Button className="rounded-none px-10">전체 너비</Button>);

    const button = screen.getByRole('button', { name: '전체 너비' });
    expect(button).toHaveClass('rounded-none', 'px-10');
    expect(button).not.toHaveClass('rounded-full', 'px-6');
  });

  it('onClick과 disabled 등 표준 button 속성이 그대로 전달된다', () => {
    const onClick = jest.fn();
    render(
      <Button onClick={onClick} disabled>
        제출
      </Button>,
    );

    const button = screen.getByRole('button', { name: '제출' });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
