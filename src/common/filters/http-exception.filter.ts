import { ArgumentsHost, BadRequestException, Catch, ExceptionFilter, HttpException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * AuthExceptionFilter
 * This filter handles exceptions related to authentication and authorization.
 * It catches UnauthorizedException, NotFoundException, and BadRequestException.
 * It formats the response with a consistent structure.
 */
@Catch(UnauthorizedException, NotFoundException, BadRequestException)
export class AuthExceptionFilter implements ExceptionFilter {

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
      success: false
    });
  }
}
