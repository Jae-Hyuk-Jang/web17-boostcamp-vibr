import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from 'src/common/types/jwt-payload.type';

export const UserId = createParamDecorator<never, string | null>(
  (_: never, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return req.user?.sub ?? null;
  },
);
