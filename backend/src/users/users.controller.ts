import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { SessionAuthGuard } from '../auth/guards';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users/search?q=query
   * 搜尋已註冊的使用者
   */
  @Get('search')
  @UseGuards(SessionAuthGuard)
  async searchUsers(@Query('q') query: string) {
    return this.usersService.searchUsers(query);
  }
}

