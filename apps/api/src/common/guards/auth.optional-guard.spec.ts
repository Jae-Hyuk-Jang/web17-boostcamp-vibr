import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedRequest } from 'src/common/types/jwt-payload.type';
import { AuthOptionalGuard } from './auth.optional-guard';

describe('AuthOptionalGuard', () => {
  const jwtService = { verifyAsync: jest.fn() };
  let guard: AuthOptionalGuard;

  const makeContext = (authorization?: string) => {
    const req = { headers: { authorization } } as AuthenticatedRequest;
    const context = {
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;

    return { req, context };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new AuthOptionalGuard(jwtService as unknown as JwtService);
  });

  it('Authorization 헤더가 없으면 비로그인으로 통과', async () => {
    // given
    const { req, context } = makeContext();

    // when, then
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(req.user).toBeUndefined();
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('유효한 토큰이면 req.user에 payload를 넣고 통과', async () => {
    // given
    const payload = { sub: 'u1' };
    jwtService.verifyAsync.mockResolvedValue(payload);
    const { req, context } = makeContext('Bearer valid-token');

    // when, then
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
    expect(req.user).toEqual(payload);
  });

  it('만료되거나 유효하지 않은 토큰이면 401 대신 비로그인으로 통과', async () => {
    // given
    jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));
    const { req, context } = makeContext('Bearer expired-token');

    // when, then
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(req.user).toBeUndefined();
  });

  it('Bearer 형식이 아니면 UnauthorizedException', async () => {
    // given
    const { context } = makeContext('Basic abc');

    // when, then
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });
});
