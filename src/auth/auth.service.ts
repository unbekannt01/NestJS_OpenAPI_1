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
import { MoreThanOrEqual, Repository, ILike, Not, IsNull } from 'typeorm';
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
import { EmailService } from 'src/user/services/email.service';
import { GoogleUserDto } from './dto/google-user.dto';
import { DeepPartial } from 'typeorm';
import { OAuth2Client } from 'google-auth-library';
import { GoogleLoginDto } from './dto/google-login.dto';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
    @Inject(forwardRef(() => OtpService)) private readonly otpService: OtpService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async loginUser(email: string, password: string): Promise<{ message: string; access_token: string; refresh_token: string; role: UserRole }> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not registered.');
    }

    checkIfSuspended(user);

    if (user.loginAttempts >= 10) {
      throw new UnauthorizedException('Account blocked due to too many failed login attempts. Please contact support.');
    }

    // if (user.is_logged_in === true) {
    //   throw new UnauthorizedException('User Already Logged In!');
    // }

    if (user.status === 'INACTIVE') {
      throw new UnauthorizedException('User needs to verify their email!');
    }

    try {
      await this.verifyPassword(password, user.password)
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

  // Using OTP Based
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
  //   // await this.emailService.sendOtpEmail(user.email, user.otp || '', user.first_name);
  //   return { message: `${user.role} registered successfully. OTP sent to email.` };
  // }

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { verificationToken: token },
    });
  }

  // After Register sent a Verification Mail 
  async save(createUserDto: CreateUserDto) {
    // Normalize email and username to lowercase
    const normalizedEmail = createUserDto.email.toLowerCase();
    const normalizedUserName = createUserDto.userName.toLowerCase();

    // Check for existing user (including soft-deleted) by normalized email
    let user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
      withDeleted: true,
    });

    if (user) {
      checkIfSuspended(user);
    }

    // Always check for username conflict (including soft-deleted) by normalized username
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
        status: UserStatus.INACTIVE,
        verificationToken, // Store the verification token
        tokenExpiration: new Date(Date.now() + 24 * 60 * 60 * 1000), // Token expires in 24 hours
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
      await this.userRepository.save(user);
    }

    await this.userRepository.save(user);

    // Send verification email with link
    const FRONTEND_BASE_URL = this.configService.get<string>('FRONTEND_BASE_URL');
    if (!FRONTEND_BASE_URL) {
      throw new Error('FRONTEND_BASE_URL is not defined in environment variables');
    }
    const verificationLink = `${FRONTEND_BASE_URL}/verify-email?token=${user.verificationToken}`;
    await this.emailService.sendVerificationEmail(user.email, verificationLink, user.first_name);

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

    await this.verifyPassword(password, user.password);
    if (password !== user.password) {
      throw new UnauthorizedException('Invalid old password!');
    }

    await this.verifyPassword(newpwd, user.password);
    if (newpwd === user.password) {
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

  async generateEmailVerificationToken(): Promise<string> {
    const token = uuidv4();
    return token;
  }

  async resendVerificationEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user || user.isEmailVerified === true) {
      throw new UnauthorizedException('User Already Verified..!'); // User not found or already verified
    }

    // Generate new verification token and expiration
    user.verificationToken = uuidv4();
    user.tokenExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiration
    await this.userRepository.save(user);

    // Send verification email
    const FRONTEND_BASE_URL = this.configService.get<string>('FRONTEND_BASE_URL');
    if (!FRONTEND_BASE_URL) {
      throw new Error('FRONTEND_BASE_URL is not defined in environment variables');
    }
    const verificationLink = `${FRONTEND_BASE_URL}/verify-email?token=${user.verificationToken}`;
    await this.emailService.sendVerificationEmail(user.email, verificationLink, user.first_name);

    return user;
  }

  // async findByEmail(email:string): Promise<User | null>{
  //   return this.userRepository.findOne({ where : { email }})
  // }

  // async registerOAuthUser(googleUser: GoogleUserDto): Promise<User> {
  //   // Check if the user already exists by email
  //   const existingUser = await this.userRepository.findOne({ where: { email: googleUser.email } });
  
  //   if (existingUser) {
  //     // User already exists, return them or do any other operation
  //     return existingUser;
  //   }
  
  //   // Create the user with the details from the Google user object
  //   const newUser: DeepPartial<User> = {
  //     email: googleUser.email,
  //     first_name: googleUser.first_name || '',
  //     last_name: googleUser.last_name || '',
  //     picture: googleUser.picture,
  //     provider: 'google',
  //     password: '',  // Placeholder
  //     mobile_no: '', // Placeholder
  //     status: UserStatus.ACTIVE, // Default status
  //     isEmailVerified: true,  // Email verification handled via OAuth
  //   };
  
  //   // Save the new user in the database
  //   return await this.userRepository.save(newUser as User);
  // }

  async googleLogin(googleLoginDto: GoogleLoginDto) {
    try {
      console.log('Received Google login request:', googleLoginDto);
      
      if (!googleLoginDto.credential) {
        throw new BadRequestException('Google credential is required');
      }

      // Verify the Google token
      const ticket = await this.googleClient.verifyIdToken({
        idToken: googleLoginDto.credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      console.log('Google payload:', payload);

      if (!payload || !payload.email) {
        throw new UnauthorizedException("Invalid Google credentials");
      }

      // Check if user exists with this email
      let user = await this.userRepository.findOne({ where: { email: payload.email } });

      if (!user) {
        // Create a new user if they don't exist
        user = this.userRepository.create({
          email: payload.email,
          first_name: payload.given_name || "",
          last_name: payload.family_name || "",
          password: await bcrypt.hash(uuidv4(), 10), // Generate a random password
          isEmailVerified: true, // Google already verified the email
          status: UserStatus.ACTIVE,
          role: UserRole.USER,
          userName: payload.email.split('@')[0], // Use email prefix as username
          is_logged_in: true,
          mobile_no: "0000000000", // Set a default mobile number
          createdBy: payload.email.split('@')[0], // Set createdBy to username
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await this.userRepository.save(user);
        console.log('Created new user:', user);
      } else {
        // Update existing user's login status
        user.is_logged_in = true;
        await this.userRepository.save(user);
        console.log('Updated existing user:', user);
      }

      // Generate tokens
      const tokens = await this.generateUserToken(user.id, user.role, user.email);
      console.log('Generated tokens:', { access_token: '***', refresh_token: tokens.refresh_token });

      return {
        message: "Google login successful",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          userName: user.userName
        },
      };
    } catch (error) {
      console.error('Google login error:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException("Failed to authenticate with Google: " + error.message);
    }
  }

  // private generateAccessToken(user: User): string {
  //   const payload = {
  //     sub: user.id,
  //     email: user.email,
  //     role: user.role,
  //   }

  //   return this.jwtService.sign(payload, {
  //     secret: process.env.JWT_SECRET,
  //     expiresIn: "15m", // 15 minutes
  //   })
  // }

  // private generateRefreshToken(): string {
  //   return uuidv4()
  // }
}