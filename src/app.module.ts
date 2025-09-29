import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { PrismaService } from './prisma/prisma.service';
import { UsersModule } from './users/users.module';
import { GameSessionsModule } from './game-sessions/game-sessions.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { WinstonLogger } from './common/logger/winston-logger.service';
import { PrismaModule } from './prisma/prisma.module';
import { LoggerModule } from './common/logger/logger.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { NewRelicMiddleware } from './common/middleware/newrelic.middleware';

@Module({
  imports: [
    // load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    UsersModule,
    GameSessionsModule,
    LeaderboardModule,
    LoggerModule,
    PrismaModule,
  ],
  providers: [
    PrismaService,
    WinstonLogger, // make Winston logger available everywhere
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes({ path: 'api/*', method: RequestMethod.ALL }); // ✅ only log real APIs
    consumer.apply(NewRelicMiddleware).forRoutes({ path: 'api/*', method: RequestMethod.ALL });
  }
}
