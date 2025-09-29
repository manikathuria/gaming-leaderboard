import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';
import { WinstonLogger } from '../logger/winston-logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: WinstonLogger) {}
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    const stack =
      typeof (exception as any).stack === 'string'
        ? (exception as any).stack
        : JSON.stringify((exception as any).stack);
    this.logger.error('Global exception caught', stack, {
      status,
      message,
    });
    const msg = typeof message === 'string' ? message : (message as any)?.message || message;

    const apiResponse: ApiResponse<null> = {
      success: false,
      statusCode: status,
      message: msg,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(apiResponse);
  }
}
