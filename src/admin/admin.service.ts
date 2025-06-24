import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {  User, UserStatus } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { EmailServiceForSupension } from 'src/auth/services/suspend-mail.service';
import { LazyModuleLoader } from '@nestjs/core';
import { RequestLog } from './entity/log.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsGateway } from 'src/websockets/notifications.gateway';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RequestLog)
    private readonly logRepository: Repository<RequestLog>,
    private readonly emailServiceForSuspend: EmailServiceForSupension,
    private readonly lazymodule: LazyModuleLoader,
    // private readonly notificationsGateway: NotificationsGateway,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldLogs() {
    console.log('Removed Logs...');
    await this.deleteAllLogs();
  }

  async suspendUser(id: string, message: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (user) {
      const oldStatus = user.status;
      user.status = UserStatus.SUSPENDED;
      user.suspensionReason = message;
      user.is_logged_in = false;
      user.refresh_token = null;
      user.expiryDate_token = null;

      await this.userRepository.save(user);

      // this.notificationsGateway.notifyAccountStatusChange(user.id, {
      //   oldStatus,
      //   newStatus: UserStatus.SUSPENDED,
      //   reason: message,
      //   suspensionReason: message,
      //   changedBy: 'Admin',
      // });

      // this.notificationsGateway.notifyAccountSuspended(
      //   user.id,
      //   message,
      //   'Admin',
      // );

      await this.emailServiceForSuspend.sendSuspensionEmail(
        user.email,
        user.first_name,
        message,
      );
    } else {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async reActivatedUser(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User Not Found...!');
    }
    if (user.status !== UserStatus.SUSPENDED) {
      throw new BadRequestException('User is Not Suspended...!');
    }

    const oldStatus = user.status;
    user.status = UserStatus.ACTIVE;
    user.suspensionReason = null;
    await this.userRepository.save(user);

    // this.notificationsGateway.notifyAccountStatusChange(user.id, {
    //   oldStatus,
    //   newStatus: UserStatus.ACTIVE,
    //   reason: 'Account reactivated by admin',
    //   changedBy: 'Admin',
    // });

    // this.notificationsGateway.notifyAccountReactivated(user.id, 'Admin');

    return {
      message: `${user.first_name} Account Re-Activated Successfully...!`,
    };
  }

  async reStoreUser(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    if (!user.deletedAt) {
      throw new BadRequestException(
        'User is not soft-deleted and cannot be restored.',
      );
    }

    await this.userRepository.restore({ id });
    return { message: 'User Restored Successfully!' };
  }

  async softDeleteUser(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found!');
    }

    user.is_logged_in = false;
    user.refresh_token = null;
    user.expiryDate_token = null;

    await this.userRepository.save(user);
    await this.userRepository.softDelete({ id });
    return { message: 'User Temporary Deleted Successfully!' };
  }

  async hardDelete(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found!');
    }

    await this.userRepository.delete({ id });
    return { message: 'User Permanently Deleted Successfully!' };
  }

  async unblockUser(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isBlocked) {
      throw new BadRequestException('User is not blocked');
    }

    await this.userRepository.update(
      { id: user.id },
      {
        loginAttempts: 0,
        isBlocked: false,
      },
    );

    // this.notificationsGateway.notifyAccountUnblocked(user.id, 'Admin');

    return {
      message: 'User has been unblocked successfully',
      email: user.email,
      userName: user.userName,
    };
  }

  async updateStatus(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException();
    }

    if (user.status === UserStatus.ACTIVE) {
      throw new ConflictException('User Already Active...!');
    }

    const oldStatus = user.status;
    user.status = UserStatus.ACTIVE;
    await this.userRepository.save(user);

    // this.notificationsGateway.notifyAccountStatusChange(user.id, {
    //   oldStatus,
    //   newStatus: UserStatus.ACTIVE,
    //   reason: 'Account activated by admin',
    //   changedBy: 'Admin',
    // });

    return { message: 'User Activated Successfully...' };
  }

  // Add this method to your existing AdminService class
  async getAllUsers() {
    const users = await this.userRepository.find({
      withDeleted: true,
      select: [
        'id',
        'role',
        'userName',
        'first_name',
        'last_name',
        'birth_date',
        'mobile_no',
        'email',
        'status',
        'is_logged_in',
        'is_Verified',
        'loginAttempts',
        'createdAt',
        'updatedAt',
        'isBlocked',
        'suspensionReason',
        'deletedAt',
      ],
    });
    return users.filter((user) => user.role !== 'ADMIN');
  }

  async loadAdminFeatures() {
    const { AdminModule } = await import('./admin.module');
    const moduleRef = await this.lazymodule.load(() => AdminModule);

    const { AdminService } = await import('./admin.service');
    return moduleRef.get(AdminService);
  }

  async logRequest(data: Partial<RequestLog>): Promise<void> {
    const log = this.logRepository.create(data);
    await this.logRepository.save(log);
  }

  async deleteAllLogs(): Promise<void> {
    return this.logRepository.clear();
  }
}
