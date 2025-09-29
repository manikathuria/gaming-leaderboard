// // src/leaderboard/leaderboard.queue.processor.ts
// import { Injectable, OnModuleInit } from '@nestjs/common';
// import { Worker, Job } from 'bullmq';
// import { RedisService } from '../common/redis/redis.service';
// import { WinstonLogger } from '../common/logger/winston-logger.service';
// import configuration from '../config/configuration';
// import { LeaderboardGateway } from './leaderboard.gateway';
// import { PrismaService } from '../prisma/prisma.service';

// @Injectable()
// export class LeaderboardQueueProcessor implements OnModuleInit {
//   private worker: Worker;
//   private connectionOptions: any;

//   constructor(
//     private readonly redisService: RedisService,
//     private readonly logger: WinstonLogger,
//     private readonly leaderboardGateway: LeaderboardGateway,
//     private readonly prisma: PrismaService,
//   ) {
//     const cfg = configuration();
//     this.connectionOptions = { connection: { url: cfg.redis.url } };
//   }

//   onModuleInit() {
//     this.worker = new Worker(
//       'leaderboard-update-queue',
//       async (job: Job) => {
//         const { userId, totalScore } = job.data as { userId: number; totalScore: number };
//         this.logger.log('Processing leaderboard update job', { userId, totalScore });

//         const client = this.redisService.getClient();

//         // Keep Redis as source for fast read; set score to DB-canonical value to avoid ordering issues.
//         // Note: Redis ZADD with NX/XX options could be used, but setting absolute value avoids race reordering.
//         // await client.zadd('leaderboard:global', { score: totalScore, value: String(userId) });
//         await client.zadd('leaderboard:global', totalScore, String(userId));

//         // Optionally store username hash to avoid extra DB call in clients
//         try {
//           const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
//           if (user) {
//             await client.hset('leaderboard:usernames', String(userId), user.username);
//           }
//         } catch (err) {
//           this.logger.warn('Failed to fetch username for caching', err.stack);
//         }

//         // Broadcast top 10 to connected clients through gateway
//         try {
//           await this.leaderboardGateway.broadcastTop(10);
//         } catch (err) {
//           this.logger.warn('Failed to broadcast in queue processor', err.stack);
//         }

//         return true;
//       },
//       this.connectionOptions,
//     );

//     this.worker.on('failed', (job, err) => {
//       this.logger.error('Leaderboard queue worker failed job', err.stack, { jobId: job?.id, data: job?.data });
//     });

//     this.logger.log('Leaderboard queue worker started');
//   }
// }

import { Injectable, OnModuleInit } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { RedisService } from '../common/redis/redis.service';
import { WinstonLogger } from '../common/logger/winston-logger.service';
import configuration from '../config/configuration';
import { LeaderboardGateway } from './leaderboard.gateway';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaderboardQueueProcessor implements OnModuleInit {
  private worker: Worker;
  private connection: any;

  constructor(
    private readonly redisService: RedisService,
    private readonly logger: WinstonLogger,
    private readonly leaderboardGateway: LeaderboardGateway,
    private readonly prisma: PrismaService,
  ) {
    const cfg = configuration();
    this.connection = { connection: { url: cfg.redis.url } };
  }

  onModuleInit() {
    this.worker = new Worker(
      'leaderboard-update-queue',
      async (job: Job) => {
        const { userId, totalScore } = job.data as { userId: number; totalScore: number };
        this.logger.log('QueueProcessor processing job', { userId, totalScore, jobId: job.id });

        const client = this.redisService.getClient();

        // set absolute value (DB canonical) to avoid ordering problems
        await client.zadd('leaderboard:global', totalScore, String(userId));

        // cache username (optional)
        try {
          const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { username: true },
          });
          if (user && user.username) {
            await client.hset('leaderboard:usernames', String(userId), user.username);
          }
        } catch (err) {
          this.logger.warn('Worker: failed caching username', err.stack);
        }

        // broadcast top N
        try {
          await this.leaderboardGateway.broadcastTop(10);
        } catch (err) {
          this.logger.warn('Worker: broadcastTop failed', err.stack);
        }

        return true;
      },
      this.connection,
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error('Leaderboard worker job failed', err.stack, {
        jobId: job?.id,
        data: job?.data,
      });
    });

    this.logger.log('LeaderboardQueueProcessor worker started');
  }
}
