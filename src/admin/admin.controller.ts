import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Admin } from 'src/common/decorators/admin.decorator';

@Admin()
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Patch('suspend/:id')
  async suspendUser(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE,
      }),
    )
    id: string,
    @Body() body: { message: string },
  ) {
    const { message } = body;
    return this.adminService.suspendUser(id, message);
  }

  @Patch('reActivated{/:id}')
  async reActivatedUser(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE,
      }),
    )
    id: string,
  ) {
    return this.adminService.reActivatedUser(id);
  }

  @Patch('unblock/:id')
  async unblockUser(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE,
      }),
    )
    id: string,
  ) {
    return this.adminService.unblockUser(id);
  }

  @Delete('softDelete/:id')
  async softDeleteUser(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE,
      }),
    )
    id: string,
  ) {
    return this.adminService.softDeleteUser(id);
  }

  @Patch('restore/:id')
  async reStoreUser(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE,
      }),
    )
    id: string,
  ) {
    return this.adminService.reStoreUser(id);
  }

  @Delete('hardDelete/:id')
  async permanantDeleteUser(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE,
      }),
    )
    id: string,
  ) {
    return this.adminService.hardDelete(id);
  }

  @Patch('update-status/:id')
  async updateStatus(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE,
      }),
    )
    id: string,
  ){
    return this.adminService.updateStatus(id)
  }
}
