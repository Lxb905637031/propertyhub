import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";

interface ErrorResponseBody {
  code: string;
  message: string;
  details?: unknown;
  requestId: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const requestId = request.header("x-request-id") ?? randomUUID();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = this.toBody(exception, requestId);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} failed (${requestId})`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(body);
  }

  private toBody(exception: unknown, requestId: string): ErrorResponseBody {
    if (!(exception instanceof HttpException)) {
      return {
        code: "INTERNAL_SERVER_ERROR",
        message: "服务暂时不可用，请稍后重试",
        requestId,
      };
    }

    const exceptionResponse = exception.getResponse();
    if (typeof exceptionResponse === "string") {
      return { code: "HTTP_ERROR", message: exceptionResponse, requestId };
    }

    const responseBody = exceptionResponse as {
      error?: string;
      message?: string | string[];
      code?: string;
    };
    const message = Array.isArray(responseBody.message)
      ? responseBody.message.join("；")
      : (responseBody.message ?? "请求处理失败");

    return {
      code: responseBody.code ?? responseBody.error ?? "HTTP_ERROR",
      message,
      requestId,
    };
  }
}
