import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * CurrentUser Decorator
 * 從 session 中提取當前已登入的 userId
 *
 * 使用方式：
 * @Get('me')
 * @UseGuards(SessionAuthGuard)
 * async getMe(@CurrentUser() userId: string) {
 *   // userId 會自動從 session 中提取
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.session.userId as string;
  },
);
