import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WinstonLogger } from '../common/logger/winston-logger.service';
import { GameSessionsService } from '../game-sessions/game-sessions.service';
import { CreateGameSessionDto } from '../game-sessions/dto/create-game-session.dto';

@Injectable()
export class LeaderboardService {
  constructor(
    private prisma: PrismaService,
    private logger: WinstonLogger,
    private gameSessionsService: GameSessionsService,
  ) {}

  async submitScore(user_id: number, score: number, game_mode = 'default') {
    this.logger.log('Start LeaderboardService.submitScore', {
      args: { user_id, score, game_mode },
    });
    try {
      const user = await this.prisma.user.findUnique({ where: { id: user_id } });
      if (!user) throw new NotFoundException('User not found');

      const dto = new CreateGameSessionDto();
      dto.userId = user_id;
      dto.score = score;
      dto.gameMode = game_mode;

      await this.gameSessionsService.create(dto);

      // ✅ Update or insert leaderboard entry
      await this.prisma.leaderboard.upsert({
        where: { userId: user_id },
        create: { userId: user_id, total_score: score },
        update: { total_score: { increment: score } },
      });

      return await this.getPlayerRank(user_id);
    } catch (error) {
      this.logger.error('LeaderboardService.submitScore error', error.stack, {
        args: { user_id, score, game_mode },
      });
      throw error;
    }
  }
  async getTop(limit = 10) {
    return this.prisma.$queryRaw<{ user_id: number; total_score: number; rank: number }[]>`
    SELECT user_id::int, total_score::int,
           RANK() OVER (ORDER BY total_score DESC)::int as rank
    FROM leaderboard
    ORDER BY total_score DESC
    LIMIT ${limit};
  `;
  }
  async getPlayerRank(user_id: number) {
    const result = await this.prisma.$queryRaw<
      { user_id: number; total_score: number; rank: number }[]
    >`
    SELECT user_id::int, total_score::int, rank FROM (
      SELECT user_id, total_score,
             RANK() OVER (ORDER BY total_score DESC)::int as rank
      FROM leaderboard
    ) r
    WHERE user_id = ${user_id};
  `;

    if (!result || result.length === 0) {
      throw new NotFoundException('Player not found in leaderboard');
    }
    return result[0];
  }

  // if we need to maintain rank column in db, then we can run this periodically rather than running
  // for every score submission.
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
