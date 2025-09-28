import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { SubmitScoreDto } from './dto/submit-score.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('leaderboard')
@Controller({
  path: 'leaderboard',
  version: '1',
})
export class LeaderboardController {
  constructor(private readonly svc: LeaderboardService) {}

  @Post('submit')
  @ApiOperation({ summary: 'Submit a score' })
  submitScore(@Body() dto: SubmitScoreDto) {
    return this.svc.submitScore(dto.userId, dto.score, dto.gameMode);
  }

  @Get('top')
  @ApiOperation({ summary: 'Top players' })
  getTop() {
    return this.svc.getTop();
  }

  @Get('rank/:user_id')
  @ApiOperation({ summary: 'Get player rank' })
  getRank(@Param('user_id') user_id: string) {
    return this.svc.getPlayerRank(Number(user_id));
  }
}
