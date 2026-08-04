import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';

const JWT_COOKIE_NAME = 'jwt';

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('check')
  healthCheck() {
    return { status: 'ok' };
  }

  /**
   * DEV-ONLY endpoint: 임시 유저 ID로 JWT 발급 (prod에서는 숨김)
   */
  @Post('login/tmp')
  async tmpLogin(@Body() body: { id: string }) {
    if (isProduction()) {
      throw new NotFoundException();
    }

    if (!body.id) {
      throw new BadRequestException('id is required');
    }

    const appJwt = await this.authService.issueJwt({ id: body.id });

    return { appJwt };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    // 쿠키 삭제는 같은 옵션(path/samesite/secure)로 덮어써야 확실함
    res.clearCookie(JWT_COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction(),
      sameSite: 'lax',
      path: '/',
    });

    return { ok: true };
  }

  @Post('google/exchange')
  async googleExchange(@Body() body: { code: string; verifier?: string }) {
    if (!body.code) {
      throw new BadRequestException('code is required');
    }

    const tokens = await this.authService.exchangeGoogle(
      body.code,
      body.verifier,
    );
    const user = await this.authService.handleGoogleSignIn(tokens);
    const appJwt = await this.authService.issueJwt({ id: user.id });

    return { appJwt };
  }
}
