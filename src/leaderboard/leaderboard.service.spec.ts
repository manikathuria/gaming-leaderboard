import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardService } from './leaderboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { WinstonLogger } from '../common/logger/winston-logger.service';
import { GameSessionsService } from '../game-sessions/game-sessions.service';
import { LeaderboardGateway } from './leaderboard.gateway';
import { QueueService } from '../common/queue/queue.service';
import { RedisService } from '../common/redis/redis.service';

describe('LeaderboardService', () => {
  let service: LeaderboardService;

  const mockPrisma = {
    user: { findUnique: jest.fn() },
    leaderboard: { upsert: jest.fn(), findMany: jest.fn() },
    $queryRaw: jest.fn(),
  };

  const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
  const mockGameSessionsService = { create: jest.fn() };
  const mockGateway = { broadcastTop: jest.fn() };
  const mockQueueService = { addLeaderboardUpdateJob: jest.fn() };
  const mockRedisService = { getClient: jest.fn().mockReturnValue({ zadd: jest.fn() }) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WinstonLogger, useValue: mockLogger },
        { provide: GameSessionsService, useValue: mockGameSessionsService },
        { provide: LeaderboardGateway, useValue: mockGateway },
        { provide: QueueService, useValue: mockQueueService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<LeaderboardService>(LeaderboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should submit score if user exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1, username: 'user1' });
    mockPrisma.leaderboard.upsert.mockResolvedValue({ userId: 1, total_score: 100 });
    mockPrisma.$queryRaw.mockResolvedValue([{ user_id: 1, total_score: 100, rank: 1 }]);

    const result = await service.submitScore(1, 50);
    expect(result).toEqual({ user_id: 1, total_score: 100, rank: 1 });
  });

  it('should return top players', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ user_id: 1, total_score: 100, rank: 1 }]);
    const result = await service.getTop(5);
    expect(result[0].user_id).toBe(1);
  });

  it('should throw NotFoundException if player not found', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([]);
    await expect(service.getPlayerRank(99)).rejects.toThrow();
  });
});
