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

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly emailServiceForSuspend: EmailServiceForSupension,
  ) {}

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

  // when user suspend it then re-activate their account.
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

  // when user softDeleted ( temporary deleted ) then restore user.
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

  // Temporary remove user ( user have in database but don't do anything )
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

  // permanantly remove user from database also.
  async hardDelete(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found!');
    }

    await this.userRepository.delete({ id });
    return { message: 'User Permanently Deleted Successfully!' };
  }

  // when user is blocked ( like if login attempts more than 10, then user is blocked. )
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
}
