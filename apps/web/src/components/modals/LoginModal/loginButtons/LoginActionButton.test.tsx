import { render, screen, fireEvent } from '@testing-library/react';

import LoginActionButton from './LoginActionButton';

describe('LoginActionButton', () => {
  const baseProps = {
    onClick: jest.fn(),
    isLoading: false,
    label: '로그인',
    loadingLabel: '이동 중…',
  };

  beforeEach(() => {
    baseProps.onClick = jest.fn();
  });

  it('로딩 중이 아니면 label을 보여주고 클릭하면 onClick이 호출된다', () => {
    render(<LoginActionButton {...baseProps} />);

    const button = screen.getByRole('button', { name: '로그인' });
    expect(button).not.toBeDisabled();

    fireEvent.click(button);
    expect(baseProps.onClick).toHaveBeenCalledTimes(1);
  });

  it('로딩 중이면 loadingLabel과 스피너를 보여주고 버튼이 비활성화된다', () => {
    render(<LoginActionButton {...baseProps} isLoading={true} />);

    const button = screen.getByRole('button', { name: /이동 중…/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('isLoading이 false여도 disabled를 명시하면 비활성화된다(다른 버튼이 로딩 중인 경우)', () => {
    render(<LoginActionButton {...baseProps} isLoading={false} disabled={true} />);

    const button = screen.getByRole('button', { name: '로그인' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'false');
  });

  it('icon은 로딩 중이 아닐 때만 렌더링된다', () => {
    render(<LoginActionButton {...baseProps} icon={<span data-testid="icon" />} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();

    render(<LoginActionButton {...baseProps} isLoading={true} icon={<span data-testid="icon-2" />} />);
    expect(screen.queryByTestId('icon-2')).not.toBeInTheDocument();
  });
});
