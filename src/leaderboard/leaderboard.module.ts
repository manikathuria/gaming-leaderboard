import { forwardRef, Module } from '@nestjs/common';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { GameSessionsModule } from 'src/game-sessions/game-sessions.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LoggerModule } from 'src/common/logger/logger.module';
import { AuthModule } from 'src/auth/auth.module';
import { LeaderboardGateway } from './leaderboard.gateway';

@Module({
  imports: [
    PrismaModule, 
    LoggerModule, 
    GameSessionsModule,
    forwardRef(() => AuthModule)
  ],
  controllers: [LeaderboardController],
  providers: [LeaderboardService, LeaderboardGateway],
  exports: [LeaderboardService, LeaderboardGateway]
})
export class LeaderboardModule {}
