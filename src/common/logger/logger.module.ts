import { Global, Module } from '@nestjs/common';
import { WinstonLogger } from './winston-logger.service';

@Global() // makes WinstonLogger available everywhere without importing repeatedly
@Module({
  providers: [WinstonLogger],
  exports: [WinstonLogger],
})
export class LoggerModule {}
