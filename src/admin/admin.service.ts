import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserStatus } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { EmailServiceForSupension } from 'src/auth/services/suspend-mail.service';
import { LazyModuleLoader } from '@nestjs/core';
import { RequestLog } from './entity/log.entity';

/**
 * AdminService
 * This service handles admin-related operations such as suspending,
 * reactivating, blocking, and deleting users.
 */

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(RequestLog)
    private readonly logRepository: Repository<RequestLog>,
    private readonly emailServiceForSuspend: EmailServiceForSupension,
    private readonly lazymodule: LazyModuleLoader,
  ) {}

  /**
   * Suspends a user by their ID.
   */
  async suspendUser(id: string, message: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (user) {
      user.status = UserStatus.SUSPENDED;
      user.suspensionReason = message;
      user.is_logged_in = false;
      user.refresh_token = null;
      user.expiryDate_token = null;
    } else {
      throw new NotFoundException('User not found.');
    }
    await this.userRepository.save(user);
    await this.emailServiceForSuspend.sendSuspensionEmail(
      user.email,
      user.first_name,
      message,
    );

    return user;
  }

  /**
   * Reactivates a suspended user by their ID.
   */
  async reActivatedUser(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User Not Found...!');
    }
    if (user.status !== UserStatus.SUSPENDED) {
      throw new BadRequestException('User is Not Suspended...!');
    }

    user.status = UserStatus.ACTIVE;
    user.suspensionReason = null;
    await this.userRepository.save(user);

    return {
      message: `${user.first_name} Account Re-Activated Successfully...!`,
    };
  }

  /**
   * Restores a soft-deleted user by their ID.
   */
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

  /**
   * soft deletes a user by their ID.
   */
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

  /**
   * Permanently deletes a user by their ID.
   */
  async hardDelete(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found!');
    }

    await this.userRepository.delete({ id });
    return { message: 'User Permanently Deleted Successfully!' };
  }

  /**
   * Unblocks a user by their ID.
   */
  async unblockUser(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isBlocked) {
      throw new BadRequestException('User is not blocked');
    }

    // Reset login attempts and blocked status
    await this.userRepository.update(
      { id: user.id },
      {
        loginAttempts: 0,
        isBlocked: false,
      },
    );

    return {
      message: 'User has been unblocked successfully',
      email: user.email,
      userName: user.userName,
    };
  }

  /**
   * Updates the status of a user to ACTIVE by their ID.
   */
  async updateStatus(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException();
    }

    if (user.status === UserStatus.ACTIVE) {
      throw new ConflictException('User Already Active...!');
    }

    user.status = UserStatus.ACTIVE;
    await this.userRepository.save(user);

    return { message: 'User Activated Successfully...' };
  }

  /**
   * Loads the AdminModule lazily.
   */
  async loadAdminFeatures() {
    const { AdminModule } = await import('./admin.module');
    const moduleRef = await this.lazymodule.load(() => AdminModule);

    const { AdminService } = await import('./admin.service');
    return moduleRef.get(AdminService);
  }

  /**
   * Logs a request to the database.
   */
  async logRequest(data: Partial<RequestLog>): Promise<void> {
    const log = this.logRepository.create(data);
    await this.logRepository.save(log);
  }

  async deleteAllLogs(): Promise<void> {
    return this.logRepository.clear();
  }
}
