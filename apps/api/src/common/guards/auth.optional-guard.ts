import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  AuthenticatedRequest,
  JwtPayload,
} from 'src/common/types/jwt-payload.type';

@Injectable()
export class AuthOptionalGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return true;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException(
        'Authorization 헤더 형식이 잘못되었습니다.',
      );
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      req.user = payload;
    } catch {
      // 만료·위조 등으로 검증에 실패한 토큰은 비로그인 요청으로 처리한다.
      // 선택적 인증 엔드포인트가 만료된 토큰 때문에 401로 실패하지 않도록 하기 위함이다.
    }

    return true;
  }
}
