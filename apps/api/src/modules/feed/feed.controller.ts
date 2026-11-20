import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { FeedShelfPageDto, FeedShelvesResponseDto } from '@repo/dto';
import { FeedShelfKey } from '@repo/dto/values';
import { AuthOptionalGuard } from 'src/common/guards/auth.optional-guard';
import { UserId } from 'src/common/decorators/user-id.decorator';
import { FeedService } from './feed.service';
import { FEED_SHELF_DEFAULT_SIZE } from './feed.constants';

@Controller('feed')
@UseGuards(AuthOptionalGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  /** 홈 첫 화면의 선반들. 로그인하면 "팔로우한 사람" 선반이 붙는다 */
  @Get('shelves')
  getShelves(
    @UserId() userId: string | null,
    @Query('limit', new DefaultValuePipe(FEED_SHELF_DEFAULT_SIZE), ParseIntPipe)
    limit: number,
  ): Promise<FeedShelvesResponseDto> {
    return this.feedService.getShelves(userId, limit);
  }

  /** 선반 하나를 이어서 불러오기 */
  @Get('shelves/:shelf')
  getShelfPage(
    @UserId() userId: string | null,
    @Param('shelf', new ParseEnumPipe(FeedShelfKey)) shelf: FeedShelfKey,
    @Query('limit', new DefaultValuePipe(FEED_SHELF_DEFAULT_SIZE), ParseIntPipe)
    limit: number,
    @Query('cursor') cursor?: string,
  ): Promise<FeedShelfPageDto> {
    return this.feedService.getShelfPage(shelf, userId, limit, cursor);
  }
}
