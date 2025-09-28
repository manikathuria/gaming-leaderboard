import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGameSessionDto } from './dto/create-game-session.dto';
import { WinstonLogger } from '../common/logger/winston-logger.service';

@Injectable()
export class GameSessionsService {
  constructor(
    private prisma: PrismaService,
    private logger: WinstonLogger,
  ) {}

  async create(dto: CreateGameSessionDto) {
    this.logger.log('Start GameSessionsService.create', { args: dto });
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });
      if (!user) throw new NotFoundException('User not found');
      return this.prisma.gameSession.create({
        data: {
          userId: dto.userId,
          score: dto.score,
          game_mode: dto.gameMode,
        },
      });
    } catch (error) {
      this.logger.error('GameSessionsService.create error', error.stack, {
        args: dto,
      });
      throw error;
    }
  }

  async findAll() {
    this.logger.log('Start GameSessionsService.findAll');
    try {
      return this.prisma.gameSession.findMany({ include: { user: true } });
    } catch (error) {
      this.logger.error('GameSessionsService.findAll error', error.stack);
      throw error;
    }
  }

  async findOne(id: number) {
    this.logger.log('Start GameSessionsService.findOne', { args: { id } });
    try {
      const sess = await this.prisma.gameSession.findUnique({ where: { id } });
      if (!sess) throw new NotFoundException('Session not found');
      return sess;
    } catch (error) {
      this.logger.error('GameSessionsService.findOne error', error.stack, {
        args: { id },
      });
      throw error;
    }
  }

  async remove(id: number) {
    this.logger.log('Start GameSessionsService.remove', { args: { id } });
    try {
      await this.findOne(id);
      return this.prisma.gameSession.delete({ where: { id } });
    } catch (error) {
      this.logger.error('GameSessionsService.remove error', error.stack, {
        args: { id },
      });
      throw error;
    }
  }
}
