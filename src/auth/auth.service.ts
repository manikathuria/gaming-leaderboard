import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { WinstonLogger } from '../common/logger/winston-logger.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLogger,
  ) {}

  // Demo-only validation
  async validateUserForDemo(username: string, password: string) {
    this.logger.log('Start AuthService.validateUserForDemo', { username });

    try {
      const user = await this.prisma.user.findUnique({ where: { username } });

      if (!user) {
        this.logger.warn('AuthService.validateUserForDemo user not found', { username });
        return null;
      }

      if (password !== 'password') {
        this.logger.warn('AuthService.validateUserForDemo invalid password', { username });
        return null;
      }

      this.logger.debug('AuthService.validateUserForDemo success', { username, userId: user.id });
      return user;
    } catch (error) {
      this.logger.error('AuthService.validateUserForDemo error', error.stack, { username });
      throw new InternalServerErrorException('Validation failed');
    }
  }

  async login(username: string, password: string) {
    this.logger.log('Start AuthService.login', { username });

    try {
      const user = await this.validateUserForDemo(username, password);

      if (!user) {
        this.logger.warn('AuthService.login invalid credentials', { username });
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = { username: user.username, sub: user.id };
      const token = this.jwtService.sign(payload);

      const response = {
        access_token: token,
        user: { id: user.id, username: user.username },
      };

      this.logger.debug('AuthService.login success', response);
      return response;
    } catch (error) {
      this.logger.error('AuthService.login error', error.stack, { username });
      throw error;
    }
  }

  verifyToken(token: string) {
    this.logger.log('Start AuthService.verifyToken');

    try {
      const payload = this.jwtService.verify(token);
      this.logger.debug('AuthService.verifyToken success', { payload });
      return payload;
    } catch (error) {
      this.logger.warn('AuthService.verifyToken invalid token', { token });
      return null;
    }
  }
}
