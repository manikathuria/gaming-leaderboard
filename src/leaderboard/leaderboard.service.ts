import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WinstonLogger } from '../common/logger/winston-logger.service';
import { GameSessionsService } from '../game-sessions/game-sessions.service';
import { CreateGameSessionDto } from '../game-sessions/dto/create-game-session.dto';
import { LeaderboardGateway } from './leaderboard.gateway';
import { QueueService } from '../common/queue/queue.service';
import { RedisService } from '../common/redis/redis.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLogger,
    private readonly gameSessionsService: GameSessionsService,
    @Inject(forwardRef(() => LeaderboardGateway))
    private readonly leaderboardGateway: LeaderboardGateway,
    private readonly queueService: QueueService,
    private readonly redisService: RedisService,
  ) {}

  private toNumber(n: number | bigint | string): number {
    if (typeof n === 'bigint') return Number(n);
    if (typeof n === 'string') return Number(n);
    return n;
  }

  // Submit score: DB upsert -> sync Redis update (best-effort) -> enqueue job -> return real-time rank (from Redis)
  async submitScore(user_id: number, score: number, game_mode = 'default') {
    this.logger.log('Start LeaderboardService.submitScore', {
      args: { user_id, score, game_mode },
    });

    // ensure user exists
    const user = await this.prisma.user.findUnique({ where: { id: user_id } });
    if (!user) throw new NotFoundException('User not found');

    // write game session
    const dto = new CreateGameSessionDto();
    dto.userId = user_id;
    dto.score = score;
    dto.gameMode = game_mode;
    await this.gameSessionsService.create(dto);

    // atomic upsert
    const upserted = await this.prisma.leaderboard.upsert({
      where: { userId: user_id },
      create: { userId: user_id, total_score: score },
      update: { total_score: { increment: score } },
    });
    const total = this.toNumber(upserted.total_score);

    // attempt to enqueue background job
    try {
      await this.queueService.addLeaderboardUpdateJob({ userId: user_id, totalScore: total });
    } catch (err) {
      this.logger.error('Failed to enqueue leaderboard update job', err.stack, {
        userId: user_id,
        total,
      });
    }

    // Synchronously update Redis (best-effort) so UI reads updated data immediately.
    // Worker will also set absolute DB-canonical value (idempotent).
    try {
      const client = this.redisService.getClient();
      await client.zadd('leaderboard:global', total, String(user_id));
      // cache username for display (optional)
      if (user.username) {
        await client.hset('leaderboard:usernames', String(user_id), user.username);
      }
    } catch (err) {
      this.logger.warn('Synchronous Redis update failed; worker should pick it up', err.stack);
    }

    // Get rank from Redis (real-time). Fallback to DB if missing.
    let rankData: { user_id: number; total_score: number; rank: number } | null = null;
    try {
      const client = this.redisService.getClient();
      const rr = await client.zrevrank('leaderboard:global', String(user_id));
      const sc = await client.zscore('leaderboard:global', String(user_id));

      if (rr !== null && sc !== null) {
        rankData = { user_id, total_score: Number(sc), rank: Number(rr) + 1 };
      }
    } catch (err) {
      this.logger.warn('Redis rank lookup failed; falling back to DB', err.stack);
    }

    if (!rankData) {
      // DB fallback (safe parameterized query)
      const rows = await this.prisma.$queryRaw<
        { user_id: number; total_score: number; rank: number }[]
      >(Prisma.sql`
        SELECT user_id::int, total_score::int, rank FROM (
          SELECT user_id, total_score,
                 RANK() OVER (ORDER BY total_score DESC)::int as rank
          FROM leaderboard
        ) r
        WHERE user_id = ${user_id};
      `);

      if (!rows || rows.length === 0) {
        throw new NotFoundException('Player not found in leaderboard');
      }
      rankData = rows[0];

      // prime Redis with canonical value (best-effort)
      try {
        const client2 = this.redisService.getClient();
        await client2.zadd('leaderboard:global', rankData.total_score, String(rankData.user_id));
      } catch (e) {
        this.logger.debug('Failed to prime Redis after DB fallback', e.stack);
      }
    }

    // Broadcast top N so UI updates (worker will broadcast too, but do it early)
    try {
      await this.leaderboardGateway.broadcastTop(10);
    } catch (err) {
      this.logger.warn('broadcastTop failed in submit flow', err.stack);
    }

    return rankData;
  }

  // getTop: prefer Redis ZSET for real-time leaderboard; fallback to DB
  async getTop(limit = 10) {
    try {
      const client = this.redisService.getClient();
      const raw = await client.zrevrange('leaderboard:global', 0, limit - 1, 'WITHSCORES');
      if (raw && raw.length > 0) {
        const out: { user_id: number; total_score: number; rank: number }[] = [];
        for (let i = 0; i < raw.length; i += 2) {
          const uid = Number(raw[i]);
          const sc = Number(raw[i + 1]);
          out.push({ user_id: uid, total_score: sc, rank: out.length + 1 });
        }
        return out;
      }
    } catch (err) {
      this.logger.warn('Redis getTop failed; falling back to DB', err.stack);
    }

    // DB fallback
    const rows = await this.prisma.$queryRaw<
      { user_id: number; total_score: number; rank: number }[]
    >(Prisma.sql`
      SELECT user_id::int, total_score::int,
             RANK() OVER (ORDER BY total_score DESC)::int as rank
      FROM leaderboard
      ORDER BY total_score DESC
      LIMIT ${limit};
    `);

    // prime Redis (best-effort)
    try {
      const client = this.redisService.getClient();
      if (rows && rows.length) {
        const entries: (string | number)[] = [];
        for (const r of rows) {
          entries.push(r.total_score, String(r.user_id)); // score, member
        }
        if (entries.length) {
          await client.zadd('leaderboard:global', ...entries);
        }
      }
    } catch (err) {
      this.logger.debug('Failed to prime Redis with DB top rows', err.stack);
    }

    return rows;
  }

  // getPlayerRank prefer Redis then DB
  async getPlayerRank(user_id: number) {
    // try Redis
    try {
      const client = this.redisService.getClient();
      const rr = await client.zrevrank('leaderboard:global', String(user_id));
      const sc = await client.zscore('leaderboard:global', String(user_id));
      if (rr !== null && sc !== null) {
        return { user_id, total_score: Number(sc), rank: Number(rr) + 1 };
      }
    } catch (err) {
      this.logger.warn('Redis getPlayerRank failed', err.stack);
    }

    // DB fallback
    const result = await this.prisma.$queryRaw<
      { user_id: number; total_score: number; rank: number }[]
    >(Prisma.sql`
      SELECT user_id::int, total_score::int, rank FROM (
        SELECT user_id, total_score,
               RANK() OVER (ORDER BY total_score DESC)::int as rank
        FROM leaderboard
      ) r
      WHERE user_id = ${user_id};
    `);

    if (!result || result.length === 0) {
      throw new NotFoundException('Player not found in leaderboard');
    }

    // prime Redis
    try {
      const client2 = this.redisService.getClient();
      await client2.zadd('leaderboard:global', result[0].total_score, String(result[0].user_id));
    } catch (err) {
      this.logger.debug('Failed to prime Redis after DB getPlayerRank', err.stack);
    }

    return result[0];
  }

  async updateRanks() {
    await this.prisma.$executeRaw`
      UPDATE leaderboard l
      SET rank = r.rank
      FROM (
        SELECT id, RANK() OVER (ORDER BY total_score DESC) AS rank
        FROM leaderboard
      ) r
      WHERE l.id = r.id;
    `;
  }

  async listAll() {
    this.logger.log('Start LeaderboardService.listAll');
    try {
      return this.prisma.leaderboard.findMany({
        include: { user: true },
        orderBy: { total_score: 'desc' },
      });
    } catch (error) {
      this.logger.error('LeaderboardService.listAll error', error.stack);
      throw error;
    }
  }

  async remove(user_id: number) {
    this.logger.log('Start LeaderboardService.remove', { args: { user_id } });
    try {
      return this.prisma.leaderboard.delete({ where: { userId: user_id } });
    } catch (error) {
      this.logger.error('LeaderboardService.remove error', error.stack, {
        args: { user_id },
      });
      throw error;
    }
  }
}
