import {
  Controller,
  Get,
  Post,
  Query,
  Redirect,
  Session,
  Req,
  Res,
  HttpStatus,
  HttpCode,
  UseGuards,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { SessionData } from 'express-session';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SessionAuthGuard } from './guards';
import { CurrentUser } from './decorators';

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
  ) {
    try {
      const { user, redirect } = await this.authService.handleGoogleCallback(
        code,
        state,
      );

      // Store user ID in session
      session.userId = user.id.toString();

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
  ) {
    try {
      const { user, redirect } = await this.authService.handleLineCallback(
        code,
        state,
      );

      // Store user ID in session
      session.userId = user.id.toString();

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

  // Get current user
  @Get('me')
  @UseGuards(SessionAuthGuard)
  async getMe(@CurrentUser() userId: string): Promise<{
    id: string;
    displayName: string | null;
    primaryEmail: string | null;
    providers: string[];
  }> {
    const user = await this.usersService.findUserById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Format response
    return {
      id: user.id,
      displayName: user.displayName,
      primaryEmail: user.primaryEmail,
      providers: user.identities.map((identity) => identity.provider),
    };
  }

  // Logout
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
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

    // Clear the session cookie
    res.clearCookie('connect.sid');

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
