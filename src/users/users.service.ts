import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { WinstonLogger } from '../common/logger/winston-logger.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private logger: WinstonLogger,
  ) {}

  async create(dto: CreateUserDto) {
    this.logger.log('Start UsersService.create', { args: dto });
    try {
      const user = await this.prisma.user.create({ data: { username: dto.username } });
      this.logger.debug('UsersService.create success', { user });
      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          this.logger.warn('UsersService.create conflict', { username: dto.username });
          throw new ConflictException(`Username "${dto.username}" already exists`);
        }
      }
      this.logger.error('UsersService.create error', error.stack, { args: dto });
      throw error;
    }
  }

  async findAll() {
    this.logger.log('Start UsersService.findAll');
    try {
      return await this.prisma.user.findMany();
    } catch (error) {
      this.logger.error('UsersService.findAll error', error.stack);
      throw error;
    }
  }

  async findOne(id: number) {
    this.logger.log('Start UsersService.findOne', { args: { id } });
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundException('User not found');
      return user;
    } catch (error) {
      this.logger.error('UsersService.findOne error', error.stack, { args: { id } });
      throw error;
    }
  }

  async update(id: number, dto: UpdateUserDto) {
    this.logger.log('Start UsersService.update', { args: { id, dto } });
    try {
      await this.findOne(id);
      return this.prisma.user.update({ where: { id }, data: dto });
    } catch (error) {
      this.logger.error('UsersService.update error', error.stack, { args: { id, dto } });
      throw error;
    }
  }

  async remove(id: number) {
    this.logger.log('Start UsersService.remove', { args: { id } });
    try {
      await this.findOne(id);
      return this.prisma.user.delete({ where: { id } });
    } catch (error) {
      this.logger.error('UsersService.remove error', error.stack, { args: { id } });
      throw error;
    }
  }
}
