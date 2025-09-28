// src/leaderboard/leaderboard.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { WinstonLogger } from '../common/logger/winston-logger.service';
import { GameSessionsService } from '../game-sessions/game-sessions.service';

describe('LeaderboardService', () => {
  let service: LeaderboardService;

  // A minimal Prisma mock that contains all methods used by the LeaderboardService
  const mockPrisma: Partial<Record<string, any>> = {
    user: {
      findUnique: jest.fn(),
    },
    leaderboard: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      // other table-specific helpers if needed
    },
    // raw query entry points used in service
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  };

  const mockGameSessionsService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    // Reset mocks to avoid cross-test pollution
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WinstonLogger, useValue: mockLogger },
        { provide: GameSessionsService, useValue: mockGameSessionsService },
      ],
    }).compile();

    service = module.get<LeaderboardService>(LeaderboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should submit score if user exists', async () => {
    // Arrange
    const userId = 1;
    const incomingScore = 50;

    // user exists
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: userId,
      username: 'user1',
    });

    // game session create resolves
    (mockGameSessionsService.create as jest.Mock).mockResolvedValue({ id: 100 });

    // upsert returns the leaderboard row (not strictly required for final return)
    (mockPrisma.leaderboard.upsert as jest.Mock).mockResolvedValue({
      id: 10,
      userId,
      total_score: 150,
    });

    // $queryRaw returns the computed rank for the player
    (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([
      { user_id: userId, total_score: 150, rank: 2 },
    ]);

    // Act
    const result = await service.submitScore(userId, incomingScore);

    // Assert
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
    expect(mockGameSessionsService.create).toHaveBeenCalled();
    expect(mockPrisma.leaderboard.upsert).toHaveBeenCalled();
    expect(mockPrisma.$queryRaw).toHaveBeenCalled(); // getPlayerRank uses $queryRaw
    expect(result).toEqual({ user_id: userId, total_score: 150, rank: 2 });
  });

  it('should return top players', async () => {
    const topRows = [
      { user_id: 2, total_score: 400, rank: 1 },
      { user_id: 5, total_score: 380, rank: 2 },
    ];
    (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(topRows);

    const res = await service.getTop(2);

    expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    expect(res).toEqual(topRows);
  });

  it('should return player rank', async () => {
    const userId = 5;
    const rankRow = [{ user_id: userId, total_score: 380, rank: 2 }];
    (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(rankRow);

    const res = await service.getPlayerRank(userId);
    expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    expect(res).toEqual(rankRow[0]);
  });

  it('should throw NotFoundException when player missing', async () => {
    (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([]);
    await expect(service.getPlayerRank(999)).rejects.toThrow(NotFoundException);
  });
});
