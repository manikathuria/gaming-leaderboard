import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';

describe('LeaderboardController', () => {
  let controller: LeaderboardController;
  let service: LeaderboardService;

  const mockService = {
    submitScore: jest.fn(),
    getTop: jest.fn(),
    getPlayerRank: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeaderboardController],
      providers: [{ provide: LeaderboardService, useValue: mockService }],
    }).compile();

    controller = module.get<LeaderboardController>(LeaderboardController);
    service = module.get<LeaderboardService>(LeaderboardService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should submit score', async () => {
    mockService.submitScore.mockResolvedValue({ message: 'Score submitted' });
    const result = await controller.submitScore({ user_id: 1, score: 50, game_mode: 'classic' });
    expect(result).toEqual({ message: 'Score submitted' });
  });

  it('should get top players', async () => {
    mockService.getTop.mockResolvedValue([{ userId: 1, total_score: 200 }]);
    expect(await controller.getTop()).toEqual([{ userId: 1, total_score: 200 }]);
  });

  it('should get player rank', async () => {
    mockService.getPlayerRank.mockResolvedValue({ userId: 1, rank: 1 });
    expect(await controller.getRank('1')).toEqual({ userId: 1, rank: 1 });
  });
});
