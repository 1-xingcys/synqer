import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Redirect,
  Session,
  Req,
  Res,
  HttpStatus,
  HttpCode,
  UseGuards,
  InternalServerErrorException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { SessionData } from 'express-session';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SessionAuthGuard } from './guards';
import { CurrentUser } from './decorators';
import {
  AuthUserResponseDto,
  LiffLoginDto,
  LogoutResponseDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  // Google OAuth routes
  @Get('google/start')
  @Redirect()
  googleStart(@Query('redirect') redirect: string) {
    const validatedRedirect = this.validateRedirectUrl(redirect);
    const url = this.authService.getGoogleAuthUrl(validatedRedirect);
    return { url };
  }

  @Get('google/callback')
  @Redirect()
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Session() session: SessionData,
    @Req() req: Request,
  ) {
    try {
      const { user, redirect } = await this.authService.handleGoogleCallback(
        code,
        state,
      );

      // Store user ID in session
      session.userId = user.id.toString();

      // 等待 session 保存完成，確保 cookie 正確發送
      await new Promise<void>((resolve, reject) => {
        req.session.save((err: Error | null) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Redirect to frontend
      const redirectUrl = redirect
        ? `${process.env.WEB_ORIGIN}${redirect}`
        : process.env.WEB_ORIGIN;

      return { url: redirectUrl };
    } catch (error) {
      console.error('Google OAuth error:', error);
      return { url: `${process.env.WEB_ORIGIN}?error=auth_failed` };
    }
  }

  // LINE OAuth routes
  @Get('line/start')
  @Redirect()
  lineStart(@Query('redirect') redirect: string) {
    const validatedRedirect = this.validateRedirectUrl(redirect);
    const url = this.authService.getLineAuthUrl(validatedRedirect);
    return { url };
  }

  @Get('line/callback')
  @Redirect()
  async lineCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Session() session: SessionData,
    @Req() req: Request,
  ) {
    try {
      const { user, redirect } = await this.authService.handleLineCallback(
        code,
        state,
      );

      // Store user ID in session
      session.userId = user.id.toString();

      // 等待 session 保存完成，確保 cookie 正確發送
      await new Promise<void>((resolve, reject) => {
        req.session.save((err: Error | null) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Redirect to frontend
      const redirectUrl = redirect
        ? `${process.env.WEB_ORIGIN}${redirect}`
        : process.env.WEB_ORIGIN;

      return { url: redirectUrl };
    } catch (error) {
      console.error('LINE OAuth error:', error);
      return { url: `${process.env.WEB_ORIGIN}?error=auth_failed` };
    }
  }

  // LIFF Login - 使用 LIFF Access Token 登入
  @Post('liff/login')
  @HttpCode(HttpStatus.OK)
  async liffLogin(
    @Body() body: LiffLoginDto,
    @Session() session: SessionData,
    @Req() req: Request,
  ): Promise<AuthUserResponseDto> {
    const { accessToken } = body;

    if (!accessToken) {
      throw new BadRequestException('accessToken is required');
    }

    try {
      const { user } = await this.authService.handleLiffLogin(accessToken);

      // Store user ID in session
      session.userId = user.id.toString();

      // 等待 session 保存完成，確保 cookie 正確發送
      await new Promise<void>((resolve, reject) => {
        req.session.save((err: Error | null) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Fetch user with identities to get providers
      const userWithIdentities = await this.usersService.findUserById(user.id);

      if (!userWithIdentities) {
        throw new BadRequestException('User not found after LIFF login');
      }

      // Return user info
      return {
        id: userWithIdentities.id,
        displayName: userWithIdentities.displayName,
        primaryEmail: userWithIdentities.primaryEmail,
        avatarUrl: userWithIdentities.avatarUrl,
        providers: userWithIdentities.identities.map(
          (identity) => identity.provider,
        ),
      };
    } catch (error) {
      console.error('LIFF login error:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('LIFF login failed');
    }
  }

  // Get current user
  @Get('me')
  @UseGuards(SessionAuthGuard)
  async getMe(@CurrentUser() userId: string): Promise<AuthUserResponseDto> {
    const user = await this.usersService.findUserById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Format response
    return {
      id: user.id,
      displayName: user.displayName,
      primaryEmail: user.primaryEmail,
      avatarUrl: user.avatarUrl,
      providers: user.identities.map((identity) => identity.provider),
    };
  }

  // Logout
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutResponseDto> {
    // Convert callback-based session.destroy to Promise
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err: Error | null) => {
        if (err) {
          console.error('Session destruction error:', err);
          reject(new InternalServerErrorException('Logout failed'));
        } else {
          resolve();
        }
      });
    });

    // Clear the session cookie with the same domain as it was set
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('synqer.sid', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      domain: isProduction ? '.synqer.club' : undefined,
    });

    // Return response body (NestJS will serialize and send it)
    return { message: 'Logged out successfully' };
  }

  // Validate redirect URL to prevent open redirect attacks
  private validateRedirectUrl(
    redirect: string | undefined,
  ): string | undefined {
    if (!redirect) {
      return undefined;
    }

    // Only allow relative paths that start with /
    if (redirect.startsWith('/')) {
      // Prevent protocol-relative URLs like //evil.com
      if (redirect.startsWith('//')) {
        throw new BadRequestException('Invalid redirect URL');
      }
      return redirect;
    }

    // Reject any other patterns (absolute URLs, javascript:, data:, etc.)
    throw new BadRequestException('Invalid redirect URL');
  }
}
