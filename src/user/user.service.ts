import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { checkIfSuspended } from 'src/common/utils/user-status.util';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import * as path from 'path';
import { unlink } from 'fs/promises';
import { AsyncLocalStorage } from 'async_hooks';
import { CloudinaryService } from 'src/common/services/cloudinary.service';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './dto/user-response.dto';
import { extractPublicId } from 'src/common/utils/resource-type.util';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly als: AsyncLocalStorage<any>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // /**
  //  * clearExpiredOtps
  //  * This method clears expired OTPs from the database.
  //  */
  // @Cron('* * * * * *') // Runs every second (adjust for production)
  // async clearExpiredOtps() {
  //   const now = new Date();
  //   await this.userRepository.update(
  //     { otpExpiration: LessThan(now) },
  //     { otp: null, otpExpiration: null, otp_type: null },
  //   );
  // }

  async getUserById(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found!');
    }

    checkIfSuspended(user);

    return this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'first_name',
        'last_name',
        'mobile_no',
        'email',
        'status',
        'userName',
        'birth_date',
        'role',
        'avatar',
      ],
    });
  }

  getHello(): string {
    return this.als.getStore();
  }

  // async updateUser(
  //   id: string,
  //   updateUserDto: UpdateUserDto,
  //   avatarFile?: Express.Multer.File,
  // ) {
  //   const user = await this.userRepository.findOne({
  //     where: { id, is_logged_in: true },
  //   });

  //   if (!user) {
  //     throw new NotFoundException('User not found or not logged in');
  //   }

  //   // // Check if a week has passed since last update
  //   // if (user.updatedAt && user.role == UserRole.USER) {
  //   //   const oneDayAgo = new Date();
  //   //   oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  //   //   if (user.updatedAt > oneDayAgo) {
  //   //     const nextUpdateDate = new Date(user.updatedAt);
  //   //     nextUpdateDate.setDate(nextUpdateDate.getDate() + 1);
  //   //     throw new UnauthorizedException(`Profile can only be updated once per day. Next update available on ${nextUpdateDate.toLocaleDateString()}`);
  //   //   }
  //   // }

  //   // Update user fields
  //   if (updateUserDto.first_name) user.first_name = updateUserDto.first_name;
  //   if (updateUserDto.last_name) user.last_name = updateUserDto.last_name;
  //   if (updateUserDto.userName) {
  //     const existingUser = await this.userRepository.findOne({
  //       where: { userName: updateUserDto.userName, id: Not(user.id) },
  //     });
  //     if (existingUser) {
  //       throw new ConflictException(
  //         'Please use a different username, it is already taken!',
  //       );
  //     }
  //     user.userName = updateUserDto.userName;
  //   }
  //   if (updateUserDto.mobile_no) user.mobile_no = updateUserDto.mobile_no;
  //   if (updateUserDto.birth_date) user.birth_date = updateUserDto.birth_date;

  //   // Handle avatar file update if provided
  //   if (avatarFile) {
  //     const avatarPath = this.saveAvatarToStorage(avatarFile);
  //     user.avatar = avatarPath;
  //   }

  //   user.updatedAt = new Date();
  //   user.updatedBy = user.first_name; // Set the updater's identity, not from DTO
  //   await this.userRepository.save(user);

  //   // Remove sensitive data before returning
  //   const {
  //     role,
  //     status,
  //     is_logged_in,
  //     age,
  //     updatedAt,
  //     createdAt,
  //     password,
  //     is_Verified,
  //     refresh_token,
  //     expiryDate_token,
  //     loginAttempts,
  //     isBlocked,
  //     ...data
  //   } = user;

  //   return {
  //     message: 'User updated successfully!',
  //     user: data,
  //     // nextUpdateAvailable: new Date(updatedAt.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
  //   };
  // }

  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
    avatarFile?: Express.Multer.File,
  ) {
    let avatarUrl: string | undefined;

    const existingUser = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    if (avatarFile && existingUser.avatar) {
      const publicId = extractPublicId(existingUser.avatar);
      await this.cloudinaryService.delete(publicId, avatarFile.mimetype);
    }

    if (avatarFile) {
      const result = await this.cloudinaryService.upload(avatarFile, 'avatars');
      avatarUrl = result.url;
    }

    const updatePayload: Record<string, any> = {
      ...updateUserDto,
      ...(avatarUrl && { avatar: avatarUrl }),
    };

    Object.keys(updatePayload).forEach((key) => {
      if (
        updatePayload[key] === null ||
        updatePayload[key] === undefined ||
        updatePayload[key] === ''
      ) {
        delete updatePayload[key];
      }
    });

    await this.userRepository.update(userId, updatePayload);

    const updatedUser = await this.userRepository.findOne({
      where: { id: userId },
    });

    const responseUser = plainToInstance(UserResponseDto, updatedUser!, {
      excludeExtraneousValues: true,
    });

    return {
      message: 'User updated successfully...!',
      data: responseUser,
    };
  }

  saveAvatarToStorage(avatarFile: Express.Multer.File) {
    const filename = `${avatarFile.originalname}`;
    const filePath = path.join(__dirname, '..', 'uploads', filename);
    return filename;
  }

  async getUserByEmail(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found!');
    }
    return user;
  }

  async getAllUser(paginationDto: PaginationQueryDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const [data, total] = await this.userRepository.findAndCount({
      take: limit,
      skip: offset,
      select: [
        'id',
        'first_name',
        'last_name',
        'mobile_no',
        'email',
        'status',
        'userName',
        'birth_date',
        'role',
      ],
    });

    return {
      data: data,
      total: total,
      limit,
      offset,
      nextPage: total > offset + limit ? offset + limit : null,
    };
  }

  async findByEmail(email): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async removeAvatar(userId: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.avatar) {
      const filePath = path.join('uploads', user.avatar);
      try {
        await unlink(filePath); // Delete file from disk
      } catch (error) {
        console.warn(`Could not delete file: ${filePath}`, error.message);
      }
    }

    user.avatar = null;
    await this.userRepository.save(user);

    return { message: 'Avatar removed successfully' };
  }
}
