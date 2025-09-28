import { Module } from '@nestjs/common';
import { GameSessionsService } from './game-sessions.service';

@Module({
  controllers: [],
  providers: [GameSessionsService],
  exports: [GameSessionsService],
})
export class GameSessionsModule {}
