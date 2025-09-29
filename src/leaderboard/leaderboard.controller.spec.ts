import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';

describe('LeaderboardController', () => {
  let controller: LeaderboardController;
  let service: LeaderboardService;

  const mockLeaderboardService = {
    submitScore: jest.fn().mockResolvedValue({ user_id: 1, total_score: 100, rank: 1 }),
    getTop: jest.fn().mockResolvedValue([{ user_id: 1, total_score: 100, rank: 1 }]),
    getPlayerRank: jest.fn().mockResolvedValue({ user_id: 1, total_score: 100, rank: 1 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeaderboardController],
      providers: [{ provide: LeaderboardService, useValue: mockLeaderboardService }],
    }).compile();

    controller = module.get<LeaderboardController>(LeaderboardController);
    service = module.get<LeaderboardService>(LeaderboardService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should submit score', async () => {
    const mockReq: any = { user: { userId: 1 } }; // simulate request with JWT user
    const dto = { score: 50 }; // dto only needs score (userId comes from req.user)

    const result = await controller.submitScore(mockReq, dto);

    expect(service.submitScore).toHaveBeenCalledWith(1, 50, undefined); // userId, score, game_mode
    expect(result).toEqual({ user_id: 1, total_score: 100, rank: 1 });
  });

  it('should return top players', async () => {
    const result = await controller.getTop();
    expect(result[0].user_id).toBe(1);
  });

  it('should return player rank', async () => {
    const result = await controller.getRank('user_1');
    expect(result.user_id).toBe(1);
  });
});
