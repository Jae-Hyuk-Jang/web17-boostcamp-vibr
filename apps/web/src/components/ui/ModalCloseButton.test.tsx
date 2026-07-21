import { render, screen, fireEvent } from '@testing-library/react';

import ModalCloseButton from './ModalCloseButton';

describe('ModalCloseButton', () => {
  it('클릭하면 onClick이 호출된다', () => {
    const onClick = jest.fn();
    render(<ModalCloseButton onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('기본 aria-label은 "닫기"다', () => {
    render(<ModalCloseButton onClick={jest.fn()} />);

    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument();
  });

  it('ariaLabel prop으로 접근성 라벨을 바꿀 수 있다', () => {
    render(<ModalCloseButton onClick={jest.fn()} ariaLabel="close" />);

    expect(screen.getByRole('button', { name: 'close' })).toBeInTheDocument();
  });
});
