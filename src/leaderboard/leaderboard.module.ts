import { forwardRef, Module } from '@nestjs/common';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { GameSessionsModule } from 'src/game-sessions/game-sessions.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LoggerModule } from 'src/common/logger/logger.module';
import { AuthModule } from 'src/auth/auth.module';
import { LeaderboardGateway } from './leaderboard.gateway';
import { RedisService } from 'src/common/redis/redis.service';
import { QueueService } from 'src/common/queue/queue.service';
import { LeaderboardQueueProcessor } from './leaderboard.queue.processor';

@Module({
  imports: [PrismaModule, LoggerModule, GameSessionsModule, forwardRef(() => AuthModule)],
  controllers: [LeaderboardController],
  providers: [
    LeaderboardService,
    LeaderboardGateway,
    RedisService,
    QueueService,
    LeaderboardQueueProcessor,
  ],
  exports: [LeaderboardService, LeaderboardGateway],
})
export class LeaderboardModule {}
