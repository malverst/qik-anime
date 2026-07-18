import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { RateDto, RateOpeningDto } from './dto';
import { CompositeAuthGuard } from '../auth/composite-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';

@Controller('ratings')
export class RatingsController {
  constructor(private readonly service: RatingsService) {}

  // Public aggregate; includes userScore if a valid token is sent
  @UseGuards(OptionalJwtAuthGuard)
  @Get('anime/:animeId')
  summary(
    @Param('animeId', ParseIntPipe) animeId: number,
    @CurrentUser() user: AuthUser | null,
  ) {
    return this.service.summary(animeId, user?.id);
  }

  @UseGuards(CompositeAuthGuard)
  @Put()
  rate(@CurrentUser() user: AuthUser, @Body() dto: RateDto) {
    return this.service.rate(user.id, dto);
  }

  @UseGuards(CompositeAuthGuard)
  @Delete('anime/:animeId')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('animeId', ParseIntPipe) animeId: number,
  ) {
    return this.service.remove(user.id, animeId);
  }

  // ---- OP/ED ratings ----

  @UseGuards(CompositeAuthGuard)
  @Put('opening')
  rateOpening(@CurrentUser() user: AuthUser, @Body() dto: RateOpeningDto) {
    return this.service.rateOpening(user.id, dto);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('opening/:animeId')
  getOpeningRatings(
    @Param('animeId', ParseIntPipe) animeId: number,
    @CurrentUser() user: AuthUser | null,
  ) {
    return this.service.getOpeningRatings(animeId, user?.id);
  }

  @UseGuards(CompositeAuthGuard)
  @Delete('opening/:animeId/:type')
  removeOpeningRating(
    @CurrentUser() user: AuthUser,
    @Param('animeId', ParseIntPipe) animeId: number,
    @Param('type') type: string,
  ) {
    return this.service.removeOpeningRating(user.id, animeId, type);
  }

  // ---- leaderboards ----

  @Get('top/anime')
  topAnime(@Query('limit') limit?: number) {
    return this.service.topAnime(limit || 20);
  }

  @Get('top/openings')
  topOpenings(@Query('limit') limit?: number) {
    return this.service.topOpenings(limit || 20);
  }

  @Get('top/endings')
  topEndings(@Query('limit') limit?: number) {
    return this.service.topEndings(limit || 20);
  }

  @Get('top/users')
  topUsers(@Query('limit') limit?: number) {
    return this.service.topUsers(limit || 20);
  }
}
