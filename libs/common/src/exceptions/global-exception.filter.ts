import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { trace } from '@opentelemetry/api';
import { v4 as uuidv4 } from 'uuid';
import { GqlContextType } from '@nestjs/graphql';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  traceId: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    // Attempt to extract the active OpenTelemetry Trace ID
    const activeSpan = trace.getActiveSpan();
    const traceId = activeSpan?.spanContext().traceId || uuidv4();

    // Context Type routing (GraphQL vs HTTP)
    const contextType = host.getType<GqlContextType>();

    if (contextType === 'graphql') {
      this.handleGraphQLError(exception, traceId);
      // For GraphQL, we re-throw the exception so Apollo Server handles the response natively
      // The error is already logged internally above.
      throw exception;
    }

    // Default to HTTP Context Handling
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = 'Internal Server Error';
    let detail = 'An unexpected error occurred.';

    // Determine exception type to set status and details
    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      title = 'Bad Request'; // Default for typical 400s
      if (httpStatus === HttpStatus.NOT_FOUND) title = 'Not Found';
      if (httpStatus === HttpStatus.UNAUTHORIZED) title = 'Unauthorized';
      if (httpStatus === HttpStatus.FORBIDDEN) title = 'Forbidden';

      // Use detailed messages for client errors (4xx)
      detail =
        typeof exceptionResponse === 'object' && exceptionResponse !== null
          ? (exceptionResponse as any).message ||
            JSON.stringify(exceptionResponse)
          : exceptionResponse.toString();
    } else {
      // 5xx errors: Mask internal details
      title = 'Internal Server Error';
      detail = 'An unexpected error occurred. Please contact support.';
    }

    // Prepare RFC 7807 payload
    const problemDetails: ProblemDetails = {
      type: `https://httpstatuses.com/${httpStatus}`,
      title,
      status: httpStatus,
      detail,
      instance: httpAdapter.getRequestUrl(request),
      traceId,
    };

    // Log the actual error internally with full stack trace and traceId
    this.logger.error(
      {
        err: exception,
        requestUrl: httpAdapter.getRequestUrl(request),
        method: httpAdapter.getRequestMethod(request),
        traceId,
      },
      exception instanceof Error ? exception.stack : 'Unknown stack trace',
      'GlobalExceptionFilter HTTP',
    );

    // Send the sanitized response
    httpAdapter.reply(response, problemDetails, httpStatus);
  }

  private handleGraphQLError(exception: unknown, traceId: string): void {
    // We just log it here. Apollo GraphQL takes care of the response.
    this.logger.error(
      {
        err: exception,
        context: 'GraphQL',
        traceId,
      },
      exception instanceof Error ? exception.stack : 'Unknown stack trace',
      'GlobalExceptionFilter GraphQL',
    );
  }
}
