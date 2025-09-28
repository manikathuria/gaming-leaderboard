import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { WinstonLogger } from '../common/logger/winston-logger.service';

describe('UsersService', () => {
  let service: UsersService;

  const mockPrisma = {
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockLogger = { log: jest.fn(), error: jest.fn(), debug: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WinstonLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create user', async () => {
    mockPrisma.user.create.mockResolvedValue({ id: 1, username: 'Alice' });
    const result = await service.create({ username: 'Alice' });
    expect(result).toEqual({ id: 1, username: 'Alice' });
  });
});
