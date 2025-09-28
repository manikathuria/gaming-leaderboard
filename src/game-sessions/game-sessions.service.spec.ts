import { Test, TestingModule } from '@nestjs/testing';
import { GameSessionsService } from './game-sessions.service';
import { PrismaService } from '../prisma/prisma.service';
import { WinstonLogger } from '../common/logger/winston-logger.service';

describe('GameSessionsService', () => {
  let service: GameSessionsService;

  const mockPrisma = {
    user: { findUnique: jest.fn() },
    gameSession: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockLogger = { log: jest.fn(), error: jest.fn(), debug: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameSessionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WinstonLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<GameSessionsService>(GameSessionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create game session if user exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.gameSession.create.mockResolvedValue({ id: 1, score: 100 });

    const result = await service.create({ userId: 1, score: 100, game_mode: 'classic' });
    expect(result).toEqual({ id: 1, score: 100 });
  });
});
