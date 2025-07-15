import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from 'src/user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { CreateUserDto } from './dto/create-user.dto';
import { checkIfSuspended } from 'src/common/utils/user-status.util';
import { ConfigService } from '@nestjs/config';
import { OtpService } from 'src/otp/otp.service';
import { EmailServiceForOTP } from 'src/otp/services/email.service';
import { Otp, OtpType } from 'src/otp/entities/otp.entity';
import {
  EmailNotVerifiedException,
  UserBlockedException,
} from 'src/common/filters/custom-exceptio.filter';
import { EmailVerification } from 'src/email-verification-by-link/entity/email-verify.entity';
import { EmailServiceForVerifyMail } from 'src/email-verification-by-link/services/email-verify.service';
import { emailTokenConfig } from 'src/config/email.config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserRegisteredPayload } from './interfaces/user-registered-payload';
import { configService } from 'src/common/services/config.service';
import * as ms from 'ms';
import { IsSuspendedGuard } from './guards/isNotSuspended.guard';
import { FileStorageService } from 'src/common/services/file-storage.service';
// import { NotificationsGateway } from 'src/websockets/notifications.gateway';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    @InjectRepository(EmailVerification)
    private readonly emailverifyRepository: Repository<EmailVerification>,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly emailServiceForOTP: EmailServiceForOTP,
    private readonly configService: ConfigService,
    private readonly emailServiceForVerification: EmailServiceForVerifyMail,
    private readonly eventEmitter: EventEmitter2,
    private readonly fileStorageService: FileStorageService
    // private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async loginUser(
    identifier: string,
    password: string,
  ): Promise<{
    message: string;
    access_token: string;
    refresh_token: string;
    role: UserRole;
    user: User;
  }> {
    const user = await this.userRepository.findOne({
      where: [
        { email: identifier.toLowerCase() },
        { userName: identifier.toLowerCase() },
      ],
    });

    if (!user) {
      throw new NotFoundException();
    }

    // Check if user is suspended
    checkIfSuspended(user);

    if (user.loginAttempts >= 10) {
      throw new UserBlockedException(user.loginAttempts);
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new EmailNotVerifiedException(user.status);
    }

    try {
      await this.verifyPassword(password, user.password);
      user.loginAttempts = 0;
      user.is_logged_in = true;
      await this.userRepository.save(user);

      const role = user.role;
      const token = await this.generateUserToken(user.id, user.role);

      // // Notify user of successful login via WebSocket
      // this.notificationsGateway.notifyLoginAttempt(
      //   user.id,
      //   'Unknown Location', // You can enhance this with IP geolocation
      //   true,
      // );

      return { message: `${role} Login Successfully!`, role, ...token, user };
    } catch (error) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      await this.userRepository.save(user);

      // Notify user of failed login attempt
      // this.notificationsGateway.notifyLoginAttempt(
      //   user.id,
      //   'Unknown Location',
      //   false,
      // );

      if (user.loginAttempts >= 10) {
        await this.userRepository.update(user.id, { isBlocked: true });

        // // Send real-time notification for account blocking
        // this.notificationsGateway.notifyAccountBlocked(
        //   user.id,
        //   'Account blocked due to too many failed login attempts',
        // );

        throw new UnauthorizedException(
          'Account blocked due to too many failed login attempts. Please contact support.',
        );
      }

      throw new UnauthorizedException(
        `Wrong Credentials. ${10 - user.loginAttempts} attempts remaining.`,
      );
    }
  }

  async loginWithOAuth(user: User) {
    user.is_logged_in = true;
    user.loginAttempts = 0;
    await this.userRepository.save(user);

    const token = await this.generateUserToken(user.id, user.role);

    return {
      message: 'Google Login Successful!',
      role: user.role,
      ...token,
      user,
    };
  }

  async simpleRegister(
    createUserDto: CreateUserDto,
    file: Express.Multer.File,
  ) {
    const normalizedEmail = createUserDto.email.toLowerCase();
    const normalizedUserName = createUserDto.userName.toLowerCase();

    const [userByEmail, userByUserName] = await Promise.all([
      this.userRepository.findOne({
        where: { email: normalizedEmail },
        withDeleted: true,
      }),
      this.userRepository.findOne({
        where: { userName: normalizedUserName },
        withDeleted: true,
      }),
    ]);

    if (userByEmail) {
      checkIfSuspended(userByEmail);

      if (userByEmail.status === 'ACTIVE') {
        throw new ConflictException('Email already registered...!');
      }
    }

    if (
      userByUserName &&
      (!userByEmail || userByUserName.id !== userByEmail.id)
    ) {
      throw new ConflictException(
        'This username is already taken. Please choose another username or contact support to restore your account.',
      );
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      ...createUserDto,
      email: normalizedEmail,
      userName: normalizedUserName,
      password: hashedPassword,
      status: UserStatus.ACTIVE,
      role: UserRole.USER,
      birth_date: createUserDto.birth_date || undefined,
      createdAt: new Date(),
      createdBy: normalizedUserName,
    });
    const savedUser = await this.userRepository.save(user);

    const payload: UserRegisteredPayload = {
      id: savedUser.id,
      email: savedUser.email,
      userName: savedUser.userName,
      role: savedUser.role,
    };

    setTimeout(async () => {
      try {
        if (file && file.buffer) {
          const uploadResult = await this.fileStorageService.upload(
            file,
            'avatar',
          );
          savedUser.avatar = uploadResult.url;
          await this.userRepository.save(savedUser);
        }

        this.eventEmitter.emit('user.registered', payload);
      } catch (err) {
        console.error('Background task failed:', err);
      }
    }, 0);

    return {
      message: `${savedUser.role} registered successfully`,
    };
  }

  async registerUsingOTP(
    createUserDto: CreateUserDto,
    file: Express.Multer.File,
  ) {
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

    let avatarUrl: string | undefined = undefined;

    if (file) {
      if (!file.buffer) {
        throw new BadRequestException('Uploaded file is empty or invalid');
      }
      const uploadResult = await this.fileStorageService.upload(file, 'avatar');
      avatarUrl = uploadResult.url;
    }

    const otp = new Otp();

    if (user) {
      if (user.status === 'ACTIVE') {
        throw new ConflictException('Email already registered...!');
      }

      otp.otp = this.otpService.generateOtp();
      otp.otpExpiration = this.otpService.getOtpExpiration();
      otp.otp_type = OtpType.EMAIL_VERIFICATION;
      otp.user = user;
    } else {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      user = this.userRepository.create({
        ...createUserDto,
        email: normalizedEmail,
        userName: normalizedUserName,
        password: hashedPassword,
        avatar: avatarUrl,
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

    await this.otpRepository.save(otp);
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

  async registerUsingEmailToken(
    createUserDto: CreateUserDto,
    file?: Express.Multer.File,
  ) {
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

    let avatarUrl: string | undefined = undefined;

    if (file) {
      if (!file.buffer) {
        throw new BadRequestException('Uploaded file is empty or invalid');
      }
      const uploadResult = await this.fileStorageService.upload(file, 'avatar');
      avatarUrl = uploadResult.url;
    }

    if (user && user.status === UserStatus.ACTIVE) {
      throw new ConflictException('Email already registered...!');
    }

    // Create new user if not already present
    if (!user) {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      user = this.userRepository.create({
        ...createUserDto,
        email: normalizedEmail,
        userName: normalizedUserName,
        password: hashedPassword,
        // avatar: file ? file.filename.replace(/\\/g, '/') : undefined,
        avatar: avatarUrl,
        status: UserStatus.INACTIVE,
        role: UserRole.USER,
        birth_date: createUserDto.birth_date || undefined,
        createdAt: new Date(),
        createdBy: createUserDto.userName,
      });

      await this.userRepository.save(user);
    }

    await this.emailverifyRepository.delete({ user: { id: user.id } });

    // Generate and save new email verification token
    const token = uuidv4();
    const tokenExpiration = new Date(
      Date.now() + emailTokenConfig.expirationMs,
    );

    const verification = this.emailverifyRepository.create({
      user: user,
      verificationToken: token,
      tokenExpiration: tokenExpiration,
    });

    await this.emailverifyRepository.save(verification);

    // Send verification email with link
    const FRONTEND_BASE_URL =
      this.configService.get<string>('FRONTEND_BASE_URL');
    if (!FRONTEND_BASE_URL) {
      throw new Error(
        'FRONTEND_BASE_URL is not defined in environment variables',
      );
    }

    const verificationLink = `${FRONTEND_BASE_URL}/verify-email?token=${token}`;
    try {
      await this.emailServiceForVerification.sendVerificationEmail(
        user.email,
        verificationLink,
        user.first_name,
      );
    } catch (error) {
      console.error('Registration Error:', error);
      throw new InternalServerErrorException(
        'Registration failed. Please try again later.',
      );
    }

    return {
      message: `${user.role} registered successfully. Verification link sent to email.`,
    };
  }

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
    user.jti = null;
    await this.userRepository.save(user);

    return { message: 'User logout successful.' };
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

  async verifyPassword(
    password: string,
    hashedPassword: string,
  ): Promise<void> {
    const isValidPassword = await bcrypt.compare(password, hashedPassword);
    if (!isValidPassword) {
      throw new UnauthorizedException('Wrong Credentials.');
    }
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
    const secret = this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const jti = uuidv4();

    const payload = {
      id: userId,
      role: role,
      jti: jti,
    };

    const access_token = this.jwtService.sign(payload, {
      secret: configService.getValue('JWT_SECRET'),
      expiresIn: configService.getValue('JWT_EXPIRES_IN'),
    });

    const refreshTokenExpiry = configService.getValue('JWT_REFRESH_EXPIRES_IN');

    const msValue = ms(refreshTokenExpiry);

    const refresh_token = uuidv4();
    const expiryDate = new Date(Date.now() + msValue);

    // Update user with refresh token
    await this.userRepository.update(
      { id: userId },
      {
        refresh_token,
        expiryDate_token: expiryDate,
        is_logged_in: true,
        jti,
      },
    );

    return {
      access_token,
      refresh_token,
      // expires_in: expiresIn,
    };
  }

  async validateRefreshToken(refresh_token: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { refresh_token }, // Match the refresh_token in the DB
    });

    if (user) {
      return true;
    }

    return false;
  }

  async validateUser(identifier: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: [
        { email: identifier.toLowerCase() },
        { userName: identifier.toLowerCase() },
      ],
    });

    if (!user) return null;

    await this.verifyPassword(password, user.password);
    return user;
  }

  async removeAvatar(userId: string): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (!user.avatar) {
      throw new BadRequestException('No avatar to remove.');
    }

    await this.fileStorageService.delete(user.avatar, 'avatar');

    user.avatar = null;
    await this.userRepository.save(user);

    return 'Avatar removed successfully.';
  }
}
