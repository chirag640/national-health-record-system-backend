import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode } from './error-codes.enum';

export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode | string;
    message: string | string[];
    details?: any;
    timestamp: string;
    path: string;
    requestId?: string;
    statusCode: number;
  };
  meta: {
    timestamp: string;
    requestId?: string;
  };
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const requestId = request.headers['x-request-id'] as string;
    const timestamp = new Date().toISOString();

    let errorCode: ErrorCode | string = ErrorCode.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const respObj = exceptionResponse as any;
        message = respObj.message || message;
        errorCode = respObj.code || this.getErrorCodeFromStatus(statusCode);
        details = respObj.details;
      } else {
        message = exceptionResponse as string;
        errorCode = this.getErrorCodeFromStatus(statusCode);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Uncaught exception: ${exception.message}`, exception.stack, {
        requestId,
        path: request.url,
      });
    }

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        details,
        timestamp,
        path: request.url,
        requestId,
        statusCode,
      },
      meta: {
        timestamp,
        requestId,
      },
    };

    // Log error with context
    this.logger.error(`[${errorCode}] ${request.method} ${request.url} - ${statusCode}`, {
      requestId,
      statusCode,
      error: message,
      userId: (request as any).user?.id,
    });

    response.status(statusCode).json(errorResponse);
  }

  private getErrorCodeFromStatus(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.RESOURCE_NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.RESOURCE_CONFLICT;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return ErrorCode.VALIDATION_FAILED;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.RATE_LIMIT_EXCEEDED;
      case HttpStatus.REQUEST_TIMEOUT:
        return ErrorCode.REQUEST_TIMEOUT;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ErrorCode.SERVICE_UNAVAILABLE;
      default:
        return ErrorCode.INTERNAL_SERVER_ERROR;
    }
  }
}
