// // src/common/queue/queue.service.ts
// import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import { Queue, Worker, Job } from 'bullmq';
// import { RedisService } from '../redis/redis.service';
// import configuration from '../../config/configuration';
// import { WinstonLogger } from '../logger/winston-logger.service';

// @Injectable()
// export class QueueService implements OnModuleInit, OnModuleDestroy {
//   private queue: Queue;
//   private worker: Worker;
// //   private scheduler: QueueScheduler;
//   private connectionOptions: any;
//   constructor(private readonly redisService: RedisService, private readonly logger: WinstonLogger) {
//     const cfg = configuration();
//     this.connectionOptions = { connection: { url: cfg.redis.url } };
//   }

//   onModuleInit() {
//     // queue name we use: leaderboard-update-queue
//     this.queue = new Queue('leaderboard-update-queue', this.connectionOptions);
//     // this.scheduler = new QueueScheduler('leaderboard-update-queue', this.connectionOptions);
//     // Worker created by application bootstrap / or you can create a separate worker process binary.
//     this.worker = new Worker(
//       'leaderboard-update-queue',
//       async (job: Job) => {
//         // We intentionally leave implementation to a processor function registered elsewhere.
//         // If you want everything in one place, you can provide the processor here.
//         // The actual processor is registered in the LeaderboardQueueProcessor file which imports QueueService.
//         this.logger.debug('Default queue worker job processed', { jobId: job.id, name: job.name });
//         return Promise.resolve();
//       },
//       this.connectionOptions,
//     );
//     this.worker.on('failed', (job, err) => {
//       this.logger.error('Queue job failed', err.message, { jobId: job?.id, name: job?.name, data: job?.data });
//     });
//   }

//   getQueue(): Queue {
//     if (!this.queue) throw new Error('Queue not initialized');
//     return this.queue;
//   }

//   async addLeaderboardUpdateJob(payload: { userId: number; totalScore: number }) {
//     try {
//       return await this.getQueue().add('update-redis', payload, {
//         removeOnComplete: true,
//         attempts: 3,
//         backoff: { type: 'exponential', delay: 500 },
//       });
//     } catch (err) {
//       this.logger.error('Failed to enqueue leaderboard update job', err.stack, { payload });
//       throw err;
//     }
//   }

//   async onModuleDestroy() {
//     await this.worker?.close();
//     await this.queue?.close();
//   }
// }
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import configuration from '../../config/configuration';
import { WinstonLogger } from '../logger/winston-logger.service';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private queue: Queue;
  private connection: any;
  constructor(private readonly logger: WinstonLogger) {
    const cfg = configuration();
    this.connection = { connection: { url: cfg.redis.url } };
  }

  onModuleInit() {
    // Single Queue instance used by the API to add jobs
    this.queue = new Queue('leaderboard-update-queue', this.connection);
    this.logger.log('QueueService initialized');
  }

  getQueue(): Queue {
    if (!this.queue) throw new Error('Queue not initialized');
    return this.queue;
  }

  // enqueue an idempotent job
  async addLeaderboardUpdateJob(payload: { userId: number; totalScore: number }) {
    try {
      return await this.getQueue().add('update-redis', payload, {
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 500 },
      });
    } catch (err) {
      this.logger.error('Failed to add leaderboard job', err.stack, { payload });
      throw err;
    }
  }

  async onModuleDestroy() {
    try {
      await this.queue?.close();
    } catch {}
  }
}
