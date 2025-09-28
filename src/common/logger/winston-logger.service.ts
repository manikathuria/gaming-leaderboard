import { Injectable, LoggerService } from '@nestjs/common';
import { createLogger, format, transports } from 'winston';

@Injectable()
export class WinstonLogger implements LoggerService {
  private logger;

  constructor() {
    this.logger = createLogger({
      level: 'debug',
      format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
      transports: [
        new transports.Console(),
        // Optionally add file transport
        // new transports.File({ filename: 'app.log' })
      ],
    });
  }

  log(message: string, meta?: any) {
    this.logger.info(message, meta);
  }

  error(message: string, trace?: string, meta?: any) {
    this.logger.error(message, { trace, ...meta });
  }

  warn(message: string, meta?: any) {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any) {
    this.logger.debug(message, meta);
  }

  verbose(message: string, meta?: any) {
    this.logger.verbose(message, meta);
  }
}
