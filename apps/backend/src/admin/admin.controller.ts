import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from '../auth/admin.guard';
import { CompositeAuthGuard } from '../auth/composite-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Post('claim')
  @UseGuards(CompositeAuthGuard)
  claim(@CurrentUser('id') userId: number, @Body() body: { secret?: string }) {
    return this.service.claimAdmin(userId, body.secret || '');
  }

  @Get('stats')
  @UseGuards(AdminGuard)
  stats() {
    return this.service.getStats();
  }

  @Get('users')
  @UseGuards(AdminGuard)
  users(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.listUsers(
      q,
      page ? +page : 1,
      limit ? +limit : 100,
    );
  }

  @Patch('users/:id/master')
  @UseGuards(AdminGuard)
  toggleMaster(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.service.toggleMaster(id, user.id, user.username);
  }

  @Delete('users/:id')
  @UseGuards(AdminGuard)
  deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.service.deleteUser(id, user.id, user.username);
  }

  @Get('server')
  @UseGuards(AdminGuard)
  server() {
    return this.service.getServerStats();
  }

  @Get('audit')
  @UseGuards(AdminGuard)
  audit(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.getAuditLogs(
      page ? +page : 1,
      limit ? +limit : 50,
    );
  }

  @Get('registrations')
  @UseGuards(AdminGuard)
  registrations(@Query('days') days?: string) {
    return this.service.getRegistrationStats(days ? +days : 30);
  }

  // ---- API tokens ----
  @Get('tokens')
  @UseGuards(AdminGuard)
  listTokens() {
    return this.service.listTokens();
  }

  @Post('tokens')
  @UseGuards(AdminGuard)
  createToken(@Body() body: { name: string }) {
    return this.service.createToken(body.name);
  }

  @Delete('tokens/:id')
  @UseGuards(AdminGuard)
  deleteToken(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteToken(id);
  }
}
