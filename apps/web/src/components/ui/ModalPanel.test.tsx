import { render, screen } from '@testing-library/react';

import ModalPanel from './ModalPanel';

describe('ModalPanel', () => {
  it('children을 렌더링한다', () => {
    render(
      <ModalPanel>
        <p>패널 내용</p>
      </ModalPanel>,
    );

    expect(screen.getByText('패널 내용')).toBeInTheDocument();
  });

  it('기본 클래스(배경·테두리·radius·overflow)가 항상 포함된다', () => {
    render(
      <ModalPanel>
        <p>내용</p>
      </ModalPanel>,
    );

    const panel = screen.getByText('내용').parentElement;
    expect(panel).toHaveClass('bg-white', 'border-2', 'border-primary', 'rounded-3xl', 'overflow-hidden', 'flex', 'flex-col');
  });

  it('전달받은 className이 기본 클래스와 함께 적용된다', () => {
    render(
      <ModalPanel className="max-w-md max-h-[70vh]">
        <p>내용</p>
      </ModalPanel>,
    );

    const panel = screen.getByText('내용').parentElement;
    expect(panel).toHaveClass('bg-white', 'max-w-md', 'max-h-[70vh]');
  });
});
