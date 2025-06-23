import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
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
import { SupaBaseService } from 'src/common/services/supabase.service';
import { FileStorageService } from 'src/common/services/file-storage.service';
import { NotificationsGateway } from 'src/websockets/notifications.gateway';

/**
 * AuthService handles user authentication, registration, and token management.
 * It provides methods for logging in, registering users, generating JWT tokens,
 * and managing user sessions.
 */

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
    private readonly fileStorageService: FileStorageService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * Login a user using email or username and password.
   */
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
    // Find user by email OR username
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

        // Send real-time notification for account blocking
        this.notificationsGateway.notifyAccountBlocked(
          user.id,
          'Account blocked due to too many failed login attempts',
        );

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

  /**
   * Register a new user with simple method.
   * This method does not send an OTP or email verification.
   */
  async simpleRegister(
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

    if (user) {
      if (user.status === 'ACTIVE') {
        throw new ConflictException('Email already registered...!');
      }
    } else {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      user = this.userRepository.create({
        ...createUserDto,
        email: normalizedEmail,
        userName: normalizedUserName,
        password: hashedPassword,
        avatar: avatarUrl,
        status: UserStatus.ACTIVE,
        role: UserRole.USER,
        birth_date: createUserDto.birth_date || undefined,
        createdAt: new Date(),
        createdBy: createUserDto.userName,
      });
    }

    await this.userRepository.save(user);

    const payload: UserRegisteredPayload = {
      id: user.id,
      email: user.email,
      userName: user.userName,
      role: user.role,
    };
    this.eventEmitter.emit('user.registered', payload);

    return {
      message: `${user.role} registered successfully`,
    };
  }

  /**
   * Register a new user and send an OTP for email verification.
   */
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

  /**
   * Register a new user and send an email verification link.
   */
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

    // Delete old tokens (optional cleanup)
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

  /**
   * Logout a user by updating their session and token status.
   */
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

  /**
   * Refresh the access token using a valid refresh token.
   */
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

  /**
   * Verify the password against the hashed password.
   */
  async verifyPassword(
    password: string,
    hashedPassword: string,
  ): Promise<void> {
    const isValidPassword = await bcrypt.compare(password, hashedPassword);
    if (!isValidPassword) {
      throw new UnauthorizedException('Wrong Credentials.');
    }
  }

  /**
   * Verifies a JWT and returns the decoded payload.
   */
  async verifyToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }

  /**
   * Get all users excluding admin users.
   */
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

  /**
   * Generate a JWT token for the user.
   */
  async generateUserToken(userId: string, role: UserRole) {
    const expiresIn = 3600; // 1 hour in seconds
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
        jti,
      },
    );

    return {
      access_token,
      refresh_token,
      expires_in: expiresIn,
    };
  }

  /**
   * Store the refresh token in the database.
   */
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

  /**
   * Validate the refresh token.
   */
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

  async validateGoogleUser(googleUser: CreateUserDto) {
    const user = await this.userRepository.findOne({
      where: { email: googleUser.email },
    });
    return user;
  }
}
