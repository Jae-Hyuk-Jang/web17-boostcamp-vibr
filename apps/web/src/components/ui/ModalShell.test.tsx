import { render, screen, fireEvent } from '@testing-library/react';

import ModalShell from './ModalShell';
import { MODAL_Z_INDEX } from '@/constants';

describe('ModalShell', () => {
  it('closeOnBackdrop이 true(기본값)일 때 배경을 클릭하면 onClose가 호출된다', () => {
    const onClose = jest.fn();
    render(
      <ModalShell onClose={onClose}>
        <div>panel</div>
      </ModalShell>,
    );

    fireEvent.mouseDown(screen.getByRole('dialog'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closeOnBackdrop이 false일 때 배경을 클릭해도 onClose가 호출되지 않는다', () => {
    const onClose = jest.fn();
    render(
      <ModalShell onClose={onClose} closeOnBackdrop={false}>
        <div>panel</div>
      </ModalShell>,
    );

    fireEvent.mouseDown(screen.getByRole('dialog'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('패널(children) 내부를 클릭하면 onClose가 호출되지 않는다', () => {
    const onClose = jest.fn();
    render(
      <ModalShell onClose={onClose}>
        <div data-testid="panel">panel</div>
      </ModalShell>,
    );

    fireEvent.mouseDown(screen.getByTestId('panel'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('role="dialog", aria-modal="true"로 렌더링된다', () => {
    render(
      <ModalShell onClose={jest.fn()}>
        <div>panel</div>
      </ModalShell>,
    );

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('z-index 클래스가 MODAL_Z_INDEX 상수와 일치한다', () => {
    render(
      <ModalShell onClose={jest.fn()}>
        <div>panel</div>
      </ModalShell>,
    );

    expect(screen.getByRole('dialog')).toHaveClass(MODAL_Z_INDEX);
  });
});
