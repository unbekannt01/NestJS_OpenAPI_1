// This file belongs in your NestJS backend project
import { Controller, Get } from '@nestjs/common';
import { Request, Response } from 'express';
import { CsrfService } from './csrf.service';
import { Public } from 'src/common/decorators/public.decorator';

@Public()
@Controller({ path: 'csrf', version: '1' })
export class CsrfController {
  constructor(private readonly csrfService: CsrfService) {}

  @Get('token')
  getToken(res: Response, req: Request) {
    const token = this.csrfService.generateToken();

    res.cookie('csrf-token', token, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return { csrfToken: token };
  }
}
