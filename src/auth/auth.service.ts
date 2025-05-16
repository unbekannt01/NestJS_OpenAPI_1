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
import { User, UserRole, UserStatus } from 'src/user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import { checkIfSuspended } from 'src/common/utils/user-status.util';
import { ConfigService } from '@nestjs/config';
import { OtpService } from 'src/otp/otp.service';
import { EmailServiceForOTP } from 'src/otp/services/email.service';
import { EmailVerification } from 'src/email-verification-by-link/entity/email-verify.entity';
import { Otp, OtpType } from 'src/otp/entities/otp.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(EmailVerification)
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => UserService))
    @Inject(forwardRef(() => OtpService))
    private readonly otpService: OtpService,
    private readonly emailServiceForOTP: EmailServiceForOTP,
    private readonly configService: ConfigService,
  ) {}

  async loginUser(
    identifier: string,
    password: string,
  ): Promise<{
    message: string;
    access_token: string;
    refresh_token: string;
    role: UserRole;
  }> {
    // Find user by email OR username
    const user = await this.userRepository.findOne({
      where: [{ email: identifier }, { userName: identifier }],
    });

    if (!user) {
      throw new NotFoundException('User not registered.');
    }

    checkIfSuspended(user);

    if (user.loginAttempts >= 10) {
      throw new UnauthorizedException(
        'Account blocked due to too many failed login attempts. Please contact support.',
      );
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
      const token = await this.generateUserToken(user.id, user.role);

      return { message: `${role} Login Successfully!`, role, ...token };
    } catch (error) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      await this.userRepository.save(user);

      if (user.loginAttempts >= 10) {
        await this.userRepository.update(user.id, { isBlocked: true });
        throw new UnauthorizedException(
          'Account blocked due to too many failed login attempts. Please contact support.',
        );
      }

      throw new UnauthorizedException(
        `Wrong Credentials. ${10 - user.loginAttempts} attempts remaining.`,
      );
    }
  }

  async resetLoginAttempts(email: string): Promise<void> {
    await this.userRepository.update({ email }, { loginAttempts: 0 });
  }

  // -- Using OTP Based
  async save(createUserDto: CreateUserDto, file: Express.Multer.File) {
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
      throw new ConflictException(
        'This username is already taken. Please choose another username or contact support to restore your account.',
      );
    }

    const otp = new Otp();

    if (user) {
      if (user.status === 'ACTIVE') {
        throw new ConflictException('Email already registered...!');
      }

      otp.otp = this.otpService.generateOtp();
      otp.otpExpiration = this.otpService.getOtpExpiration();
      otp.otp_type = OtpType.EMAIL_VERIFICATION;
    } else {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      user = this.userRepository.create({
        ...createUserDto,
        email: normalizedEmail,
        userName: normalizedUserName,
        password: hashedPassword,
        avatar: file ? file.filename.replace(/\\/g, '/') : undefined,
        status: UserStatus.INACTIVE,
        role: UserRole.USER,
        birth_date: createUserDto.birth_date || undefined,
        createdAt: new Date(),
        createdBy: createUserDto.userName,
      });

      otp.otp = this.otpService.generateOtp();
      otp.otpExpiration = this.otpService.getOtpExpiration();
      otp.otp_type = OtpType.EMAIL_VERIFICATION;
    }

    await this.userRepository.save(user);

    await this.emailServiceForOTP.sendOtpEmail(
      user.email,
      otp.otp || '',
      user.first_name,
    );
    return {
      message: `${user.role} registered successfully. OTP sent to email.`,
    };
  }

  // // -- After Register sent a Verification Mail
  // async save(createUserDto: CreateUserDto, file?: Express.Multer.File) {
  //   const normalizedEmail = createUserDto.email.toLowerCase();
  //   const normalizedUserName = createUserDto.userName.toLowerCase();

  //   let user = await this.userRepository.findOne({
  //     where: { email: normalizedEmail },
  //     withDeleted: true,
  //   });

  //   if (user) {
  //     checkIfSuspended(user);
  //   }

  //   const usernameConflict = await this.userRepository.findOne({
  //     where: { userName: normalizedUserName },
  //     withDeleted: true,
  //   });

  //   if (usernameConflict && (!user || usernameConflict.id !== user.id)) {
  //     throw new ConflictException('This username is already taken. Please choose another username or contact support to restore your account.');
  //   }

  //   if (user && user.status === UserStatus.ACTIVE) {
  //     throw new ConflictException('Email already registered...!');
  //   }

  //   // Create new user if not already present
  //   if (!user) {
  //     const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
  //     user = this.userRepository.create({
  //       ...createUserDto,
  //       email: normalizedEmail,
  //       userName: normalizedUserName,
  //       password: hashedPassword,
  //       avatar: file ? file.filename.replace(/\\/g, '/') : undefined,
  //       status: UserStatus.INACTIVE,
  //       role: UserRole.USER,
  //       birth_date: createUserDto.birth_date || undefined,
  //       createdAt: new Date(),
  //       createdBy: createUserDto.userName,
  //     });

  //     await this.userRepository.save(user);
  //   }

  //   // Delete old tokens (optional cleanup)
  //   await this.emailverifyRepository.delete({ user: { id: user.id } });

  //   // Generate and save new email verification token
  //   const token = uuidv4();
  //   const tokenExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  //   const verification = this.emailverifyRepository.create({
  //     user: user,
  //     verificationToken: token,
  //     tokenExpiration: tokenExpiration,
  //   });

  //   await this.emailverifyRepository.save(verification);

  //   // Send verification email with link
  //   const FRONTEND_BASE_URL = this.configService.get<string>('FRONTEND_BASE_URL');
  //   if (!FRONTEND_BASE_URL) {
  //     throw new Error('FRONTEND_BASE_URL is not defined in environment variables');
  //   }

  //   const verificationLink = `${FRONTEND_BASE_URL}/verify-email?token=${token}`;
  //   await this.emailServiceForVerification.sendVerificationEmail(user.email, verificationLink, user.first_name);

  //   return {
  //     message: `${user.role} registered successfully. Verification link sent to email.`,
  //   };
  // }

  async logout(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });

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

  async changepwd(id: string, password: string, newpwd: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User Not Found...!');
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
      throw new UnauthorizedException(
        'New password cannot be the same as the old password!',
      );
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

    return this.generateUserToken(token.id, token.role);
  }

  async verifyPassword(password: string, hashedPassword: string) {
    const isValidPassword = await bcrypt.compare(password, hashedPassword);
    if (!isValidPassword) {
      throw new UnauthorizedException('Wrong Credentials.');
    }
  }

  async verifyToken(token: string) {
    const decoded = this.jwtService.verify(token, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });
    return decoded;
  }

  async getAllUsers(): Promise<User[]> {
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
        'refresh_token',
        'expiryDate_token',
        'is_logged_in',
        'is_Verified',
        'loginAttempts',
        'createdAt',
        'updatedAt',
        'createdAt',
        'isBlocked',
        'suspensionReason',
        'deletedAt',
      ],
    });
    return users.filter((user) => user.role !== 'ADMIN');
  }

  async generateUserToken(userId: string, role: UserRole) {
    const expiresIn = 3600; // 1 hour in seconds
    const secret = this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const payload = {
      id: userId,
      role: role,
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
        is_logged_in: true,
      },
    );

    return {
      access_token,
      refresh_token,
      expires_in: expiresIn,
    };
  }

  async storeRefreshToken(
    refresh_token: string,
    userId: string,
    role: UserRole,
    email: string,
  ) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    await this.userRepository.update(
      { id: userId },
      { refresh_token, role, expiryDate_token: expiryDate, email },
    );

    console.log('Now:', new Date());
  }

  async validateRefreshToken(refresh_token: string): Promise<boolean> {
    // Find user by refresh_token in the database
    const user = await this.userRepository.findOne({
      where: { refresh_token }, // Match the refresh_token in the DB
    });

    // If the user is found, refresh_token is valid
    if (user) {
      return true;
    }

    // If no matching refresh_token, it's invalid
    return false;
  }
}
