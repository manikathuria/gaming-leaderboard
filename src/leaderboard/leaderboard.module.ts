import { Module } from '@nestjs/common';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { GameSessionsModule } from 'src/game-sessions/game-sessions.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LoggerModule } from 'src/common/logger/logger.module';

@Module({
  imports: [PrismaModule, LoggerModule, GameSessionsModule],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
})
export class LeaderboardModule {}
