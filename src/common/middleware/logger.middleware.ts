import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WinstonLogger } from '../logger/winston-logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: WinstonLogger) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, body, query, params } = req;
    const startTime = Date.now();
    const logger = this.logger;
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      // ✅ `this` now refers to LoggerMiddleware
      logger.log('API Request', {
        method,
        url: originalUrl,
        params,
        query,
        body,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      });
    });

    next();
  }
}
