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
import { Public } from 'src/common/decorators/public.decorator';

/**
 * AdminController handles admin-related operations such as suspending,
 * reactivating, blocking, and deleting users.
 */

@Admin()
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Suspends a user by their ID.
   */
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

  /**
   * Reactivates a suspended user by their ID.
   */
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

  /**
   * Unblocks a user by their ID.
   */
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

  /**
   * Soft deletes a user by their ID.
   */
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

  /**
   * Restores a soft-deleted user by their ID.
   */
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

  /**
   * Permanently deletes a user by their ID.
   */
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

  /**
   * Updates the status of a user by their ID.
   */
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
  ) {
    return this.adminService.updateStatus(id);
  }

  /**
   * Deletes all request logs.
   */
  @Public()
  @Delete('logs')
  deleteAllLogs() {
    return this.adminService.deleteAllLogs();
  }
}
