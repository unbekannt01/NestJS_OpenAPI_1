import { Controller, Post } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';

@Public()
@Controller({ path: 'protected', version: '1'})
export class ProtectedController {
  @Post()
  secureEndpoint() {
    return { message: 'CSRF check passed, request accepted.' };
  }
}
