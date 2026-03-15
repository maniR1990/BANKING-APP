import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { trace } from '@opentelemetry/api';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req: Request) => {
          // Attempt to get active trace span, otherwise generate unique UUID
          const activeSpan = trace.getActiveSpan();
          return activeSpan?.spanContext().traceId || uuidv4();
        },
        customProps: (req: Request, res: any) => {
          return {
            traceId: req.id,
          };
        },
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined, // JSON output for production (e.g., Loki/Grafana)
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class AppLoggerModule {}
