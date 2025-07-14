import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { CsrfService } from './csrf.service';
import { Public } from 'src/common/decorators/public.decorator';

@Public()
@Controller({ path: 'csrf', version: '1' })
export class CsrfController {
  constructor(private readonly csrfService: CsrfService) {}

  @Get('token')
  getToken(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
    const token = this.csrfService.generateToken();

    res.cookie('csrf-token', token, {
      httpOnly: false,
      sameSite: 'lax',
      secure: false,
    });

    return { csrfToken: typeof req.csrfToken === 'function' }; // Must return JSON
  }
}
