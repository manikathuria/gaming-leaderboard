import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const newrelic = require('newrelic');

@Injectable()
export class NewRelicMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Name transaction by route
    const route = req.originalUrl || req.url;
    newrelic.setTransactionName(route);

    // Attach response timing
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      newrelic.recordCustomEvent('HttpResponse', {
        method: req.method,
        route,
        statusCode: res.statusCode,
        durationMs: duration,
      });
    });

    next();
  }
}
