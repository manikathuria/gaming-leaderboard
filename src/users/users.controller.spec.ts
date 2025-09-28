import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    create: jest.fn((dto) => ({ id: 1, ...dto })),
    findAll: jest.fn(() => [{ id: 1, username: 'Alice' }]),
    findOne: jest.fn((id) => ({ id, username: 'Alice' })),
    update: jest.fn((id, dto) => ({ id, ...dto })),
    remove: jest.fn((id) => ({ id })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create user', () => {
    expect(controller.create({ username: 'Alice' })).toEqual({ id: 1, username: 'Alice' });
  });

  it('should return all users', () => {
    expect(controller.findAll()).toEqual([{ id: 1, username: 'Alice' }]);
  });

  it('should return one user', () => {
    expect(controller.findOne('1')).toEqual({ id: 1, username: 'Alice' }); // ✅ number
  });

  it('should update user', () => {
    expect(controller.update('1', { username: 'Bob' })).toEqual({ id: 1, username: 'Bob' }); // ✅ number
  });

  it('should delete user', () => {
    expect(controller.remove('1')).toEqual({ id: 1 }); // ✅ number
  });
});
