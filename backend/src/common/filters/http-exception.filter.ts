import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global HTTP exception filter.
 * Catches all HTTP exceptions and formats them consistently.
 * Logs errors for monitoring and debugging.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extract error message and details
    const errorMessage =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || 'An error occurred';

    const errorDetails =
      typeof exceptionResponse === 'object' && (exceptionResponse as any).error
        ? (exceptionResponse as any).error
        : exception.name;

    // Log error with context
    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - ${errorMessage}`,
      exception.stack,
    );

    // Send formatted error response
    response.status(status).json({
      success: false,
      statusCode: status,
      error: errorDetails,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    });
  }
}

/**
 * Catch-all exception filter for non-HTTP exceptions.
 * Handles unexpected errors and returns 500 Internal Server Error.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine status code
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extract error message
    const message =
      exception instanceof Error
        ? exception.message
        : 'Internal server error';

    // Log critical error
    this.logger.error(
      `${request.method} ${request.url} - UNHANDLED ERROR: ${message}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    // Send error response
    response.status(status).json({
      success: false,
      statusCode: status,
      error: 'Internal Server Error',
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    });
  }
}
