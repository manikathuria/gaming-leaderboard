import { Controller, Post, Body, Get, Param, UseGuards, Req } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { SubmitScoreDto } from './dto/submit-score.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('leaderboard')
@Controller({
  path: 'leaderboard',
  version: '1',
})
export class LeaderboardController {
  constructor(private readonly svc: LeaderboardService) {}

  @Post('submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit score (JWT protected). Only logged-in user can submit their own score.' })
  submitScore(@Req() req: Request, @Body() dto: SubmitScoreDto) {
    const userId = (req as any).user.userId;
    console.log(`user object - ${userId}`);
    return this.svc.submitScore(userId, dto.score, dto.gameMode);
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
