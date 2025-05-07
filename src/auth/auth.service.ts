import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { OtpType, User, UserRole, UserStatus } from 'src/user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from 'src/user/user.service';
// import { EmailService } from 'src/user/services/email.service';
import { checkIfSuspended } from 'src/common/utils/user-status.util';
import { ConfigService } from '@nestjs/config';
import { OtpService } from 'src/otp/otp.service';
import { EmailServiceForVerifyMail } from 'src/email-verification-by-link/services/email.service';
import { EmailServiceForOTP } from 'src/otp/services/email.service';
import { EmailServiceForSupension } from './services/suspend-mail.service';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
    @Inject(forwardRef(() => OtpService)) private readonly otpService: OtpService,
    private readonly emailServiceForVerification: EmailServiceForVerifyMail,
    private readonly emailServiceForOTP: EmailServiceForOTP,
    private readonly emailServiceForSuspend: EmailServiceForSupension,
    private readonly configService: ConfigService,
  ) { }

  async loginUser(identifier: string, password: string): Promise<{ message: string; access_token: string; refresh_token: string; role: UserRole }> {
    // Find user by email OR username
    const user = await this.userRepository.findOne({
      where: [
        { email: identifier },
        { userName: identifier },
      ],
    });

    if (!user) {
      throw new NotFoundException('User not registered.');
    }

    checkIfSuspended(user);

    if (user.loginAttempts >= 10) {
      throw new UnauthorizedException('Account blocked due to too many failed login attempts. Please contact support.');
    }

    if (user.status === 'INACTIVE') {
      throw new UnauthorizedException('User needs to verify their email!');
    }

    try {
      await this.verifyPassword(password, user.password);
      user.loginAttempts = 0;
      user.is_logged_in = true;
      await this.userRepository.save(user);

      const role = user.role;
      const token = await this.generateUserToken(user.id, user.role, user.email);

      return { message: `${role} Login Successfully!`, role, ...token };
    } catch (error) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      await this.userRepository.save(user);

      if (user.loginAttempts >= 10) {
        await this.userRepository.update(user.id, { isBlocked: true });
        throw new UnauthorizedException('Account blocked due to too many failed login attempts. Please contact support.');
      }

      throw new UnauthorizedException(`Wrong Credentials. ${10 - user.loginAttempts} attempts remaining.`);
    }
  }

  async resetLoginAttempts(email: string): Promise<void> {
    await this.userRepository.update(
      { email },
      { loginAttempts: 0 }
    );
  }

  // // -- Using OTP Based
  // async save(createUserDto: CreateUserDto) {
  //   // Normalize email and username to lowercase
  //   const normalizedEmail = createUserDto.email.toLowerCase();
  //   const normalizedUserName = createUserDto.userName.toLowerCase();

  //   // Check for existing user (including soft-deleted) by normalized email
  //   let user = await this.userRepository.findOne({
  //     where: { email: normalizedEmail },
  //     withDeleted: true,
  //   });

  //   if (user) {
  //     checkIfSuspended(user);
  //   }

  //   // Always check for username conflict (including soft-deleted) by normalized username
  //   const usernameConflict = await this.userRepository.findOne({
  //     where: { userName: normalizedUserName },
  //     withDeleted: true,
  //   });

  //   if (usernameConflict && (!user || usernameConflict.id !== user.id)) {
  //     throw new ConflictException('This username is already taken. Please choose another username or contact support to restore your account.');
  //   }

  //   if (user) {
  //     if (user.status === 'ACTIVE') {
  //       throw new ConflictException('Email already registered...!');
  //     }

  //     if (!user.otp) {
  //       user.otp = this.otpService.generateOtp();
  //       user.otpExpiration = this.otpService.getOtpExpiration();
  //       user.otp_type = OtpType.EMAIL_VERIFICATION;
  //     }
  //   } else {
  //     const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
  //     user = this.userRepository.create({
  //       ...createUserDto,
  //       email: normalizedEmail, // Store the email in lowercase
  //       userName: normalizedUserName, // Store the username in lowercase
  //       password: hashedPassword,
  //       status: UserStatus.INACTIVE,
  //       otp: this.otpService.generateOtp(),
  //       otpExpiration: this.otpService.getOtpExpiration(),
  //       otp_type: OtpType.EMAIL_VERIFICATION,
  //       role: UserRole.USER,
  //       birth_date: createUserDto.birth_date || undefined,
  //       createdAt: new Date(),
  //       createdBy: createUserDto.userName, // Set createdBy to user's email
  //     });
  //   }

  //   if (user.birth_date) {
  //     const today = new Date();
  //     const birthDate = new Date(user.birth_date);
  //     let age = today.getFullYear() - birthDate.getFullYear();
  //     // const monthDiff = today.getMonth() - birthDate.getMonth();

  //     user.age = age;
  //     await this.userRepository.save(user);
  //   }

  //   await this.userRepository.save(user);

  //   // Send OTP via Email only (no SMS during registration)
  //   await this.emailServiceForOTP.sendOtpEmail(user.email, user.otp || '', user.first_name);
  //   return { message: `${user.role} registered successfully. OTP sent to email.` };
  // }

  // -- After Register sent a Verification Mail 
  async save(createUserDto: CreateUserDto, file?: Express.Multer.File) {

    const normalizedEmail = createUserDto.email.toLowerCase();
    const normalizedUserName = createUserDto.userName.toLowerCase();

    let user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
      withDeleted: true,
    });

    if (user) {
      checkIfSuspended(user);
    }

    const usernameConflict = await this.userRepository.findOne({
      where: { userName: normalizedUserName },
      withDeleted: true,
    });

    if (usernameConflict && (!user || usernameConflict.id !== user.id)) {
      throw new ConflictException('This username is already taken. Please choose another username or contact support to restore your account.');
    }

    if (user) {
      if (user.status === 'ACTIVE') {
        throw new ConflictException('Email already registered...!');
      }
    } else {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const verificationToken = uuidv4(); // Generate UUID token for email verification
      user = this.userRepository.create({
        ...createUserDto,
        email: normalizedEmail,
        userName: normalizedUserName,
        password: hashedPassword,
        avatar: file ? file.filename.replace(/\\/g, '/') : undefined, // Save just the filename
        status: UserStatus.INACTIVE,
        verificationToken,
        tokenExpiration: new Date(Date.now() + 24 * 60 * 60 * 1000),
        role: UserRole.USER,
        birth_date: createUserDto.birth_date || undefined,
        createdAt: new Date(),
        createdBy: createUserDto.userName,
      });
    }

    if (user.birth_date) {
      const today = new Date();
      const birthDate = new Date(user.birth_date);
      let age = today.getFullYear() - birthDate.getFullYear();
      user.age = age;
    }

    await this.userRepository.save(user);

    // Send verification email with link
    const FRONTEND_BASE_URL = this.configService.get<string>('FRONTEND_BASE_URL');
    if (!FRONTEND_BASE_URL) {
      throw new Error('FRONTEND_BASE_URL is not defined in environment variables');
    }
    const verificationLink = `${FRONTEND_BASE_URL}/verify-email?token=${user.verificationToken}`;
    await this.emailServiceForVerification.sendVerificationEmail(user.email, verificationLink, user.first_name);

    return { message: `${user.role} registered successfully. Verification link sent to email.` };
  }

  async logout(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (!user.is_logged_in) {
      throw new UnauthorizedException('User already logged out.');
    }

    user.is_logged_in = false;
    user.refresh_token = null;
    user.expiryDate_token = null;
    await this.userRepository.save(user);

    return { message: 'User logout successful.' };
  }

  // Helper method to verify access token (JWT)
  verifyAccessToken(token: string): any {
    const jwt = require('jsonwebtoken');
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new UnauthorizedException('Invalid access token.');
    }
  }

  async changepwd(email: string, password: string, newpwd: string) {
    const user = await this.userRepository.findOne({ where: { email } });
  
    if (!user) {
      throw new UnauthorizedException('Email is Invalid!');
    }
  
    if (!user.is_logged_in) {
      throw new UnauthorizedException('Please Login First!');
    }
  
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid old password!');
    }
  
    const isSame = await bcrypt.compare(newpwd, user.password);
    if (isSame) {
      throw new UnauthorizedException('New password cannot be the same as the old password!');
    }
  
    user.password = await bcrypt.hash(newpwd, 10);
    await this.userRepository.save(user);
  
    return { message: 'User Successfully Changed their Password!' };
  }
  
  async refreshToken(refresh_token: string) {
    const token = await this.userRepository.findOne({
      where: {
        refresh_token: refresh_token,
        expiryDate_token: MoreThanOrEqual(new Date()),
      },
    });

    if (!token) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    return this.generateUserToken(token.id, token.role, token.email);
  }

  async verifyPassword(password: string, hashedPassword: string) {
    const isValidPassword = await bcrypt.compare(password, hashedPassword);
    if (!isValidPassword) {
      throw new UnauthorizedException('Wrong Credentials.');
    }
  }

  async verifyToken(token: string) {
    const decoded = this.jwtService.verify(token, {
      secret: this.configService.get<string>('JWT_SECRET')
    });
    return decoded;
  }

  // When a user is caught engaging in illegal activities, suspend their account and display a message.
  async suspendUser(id: string, message: string) {
    const user = await this.userRepository.findOne({ where: { id } })
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
    await this.emailServiceForSuspend.sendSuspensionEmail(user.email, user.first_name, message);

    return user;
  }

  // when user suspend it then re-activate their account.
  async reActivatedUser(id: string) {
    const user = await this.userRepository.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundException('User Not Found...!')
    }
    if (user.status !== UserStatus.SUSPENDED) {
      throw new BadRequestException('User is Not Suspended...!')
    }

    user.status = UserStatus.ACTIVE;
    user.suspensionReason = null;
    await this.userRepository.save(user);

    return { message: `${user.first_name} Account Re-Activated Successfully...!` }
  }

  // when user softDeleted ( temporary deleted ) then restore user.
  async reStoreUser(id: string) {
    const user = await this.userRepository.findOne({ where: { id }, withDeleted: true });

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    if (!user.deletedAt) {
      throw new BadRequestException('User is not soft-deleted and cannot be restored.');
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

    user.is_logged_in === false;
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
        isBlocked: false
      }
    );

    return {
      message: 'User has been unblocked successfully',
      email: user.email,
      userName: user.userName
    };
  }

  async getAllUsers(): Promise<User[]> {
    const users = await this.userRepository.find({
      withDeleted: true,
      select: ["id", "role", "userName", "first_name", "last_name", "birth_date", "mobile_no", "email", "status", "refresh_token", "expiryDate_token", "age", "is_logged_in", "is_Verified", "loginAttempts", "createdAt", "updatedAt", "createdAt", "isBlocked", "suspensionReason", "deletedAt"],
    });
    return users.filter(user => user.role !== "ADMIN");
  }

  async generateUserToken(userId: string, role: UserRole, email: string) {
    const expiresIn = 3600; // 1 hour in seconds
    const secret = this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const payload = {
      id: userId,
      role: role,
      email: email
    };

    const access_token = this.jwtService.sign(payload, {
      secret,
      expiresIn: '1h',
    });

    const refresh_token = uuidv4();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // 7 days from now

    // Update user with refresh token
    await this.userRepository.update(
      { id: userId },
      {
        refresh_token,
        expiryDate_token: expiryDate,
        is_logged_in: true
      }
    );

    return {
      access_token,
      refresh_token,
      expires_in: expiresIn
    };
  }

  async storeRefreshToken(refresh_token: string, userId: string, role: UserRole, email: string) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // 7 days from now

    await this.userRepository.update(
      { id: userId },
      { refresh_token, role, expiryDate_token: expiryDate, email },
    );

    console.log('Now:', new Date());
  }
}