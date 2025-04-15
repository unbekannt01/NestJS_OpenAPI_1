import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { OtpType, User, UserRole } from 'src/user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import { EmailService } from 'src/user/services/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService, 
    private readonly emailService: EmailService,
  ) { }

  async loginUser(email: string, password: string): Promise<{ message: string; access_token: string; refresh_token: string; role: UserRole }> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not registered.');
    }

    if (user.status === 'INACTIVE') {
      throw new UnauthorizedException('User needs to verify their email!');
    }

    await this.verifyPassword(password, user.password);

    const role = user.role;
    user.is_logged_in = true;
    await this.userRepository.save(user);

    // Generate JWT Token
    const token = await this.generateUserToken(user.id, user.role);

    return { message: `${role} Login Successfully!`, role, ...token };
  }

  async save(createUserDto: CreateUserDto) {
    let user = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (user) {
      if (user.status === 'ACTIVE') {
        throw new ConflictException('Email already registered...!');
      }

      if (user.userName == createUserDto.userName) {
        throw new ConflictException('Username already registered...!');
      }

      if (!user.otp) {
        user.otp = this.userService.generateOtp();
        user.otpExpiration = this.userService.getOtpExpiration();
        user.otp_type = OtpType.EMAIL_VERIFICATION;
      }
    } else {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      user = this.userRepository.create({
        ...createUserDto,
        password: hashedPassword,
        status: 'INACTIVE',
        otp: this.userService.generateOtp(),
        otpExpiration: this.userService.getOtpExpiration(),
        otp_type: OtpType.EMAIL_VERIFICATION,
        role: UserRole.USER
      });
    }

    const role = user.role;

    await this.userRepository.save(user);

    // Send OTP via Email only (no SMS during registration)
    await this.emailService.sendOtpEmail(user.email, user.otp || '', user.first_name);
    return { message: `${role} registered successfully. OTP sent to email.` };
  }

  async logout(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User Not Found!');
    }

    if (user.is_logged_in === false) {
      throw new UnauthorizedException('User Already Logged Out!');
    }

    user.is_logged_in = false;
    user.token = null; // Clear the token on logout
    user.expiryDate_token = null; // Clear the token expiration date on logout
    await this.userRepository.save(user);

    return { message: 'User Logout Successfully!' };
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
    if (newpwd === password) {
      throw new UnauthorizedException('New password cannot be the same as the old password!');
    }

    user.password = await bcrypt.hash(newpwd, 10);
    await this.userRepository.save(user);

    return { message: 'User Successfully Changed their Password!' };
  }

  async generateUserToken(userId: string, role: UserRole) {
    const payload = {
      id: userId,
      UserRole: role, // Ensure the role field is named 'role'
    };

    const secret = process.env.JWT_SECRET; // Fallback for missing secret
    // console.log('Using JWT_SECRET:', secret); // Debugging

    const access_token = this.jwtService.sign(payload, { secret });
    const refresh_token = uuidv4();
    await this.storeRefreshToken(refresh_token, userId, role);
    return {
      access_token,
      refresh_token,
    };
  }

  async storeRefreshToken(token: string, userId: string, role: UserRole) {
    const expiresIn = new Date();
    expiresIn.setDate(expiresIn.getDate() + 7); // 7 days expiration

    await this.userRepository.update(
      { id: userId },
      { token, role, expiryDate_token: expiresIn },
    );
  }

  async refreshToken(refresh_token: string) {
    const token = await this.userRepository.findOne({
      where: {
        token: refresh_token,
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
      secret: process.env.JWT_SECRET,
    });
    
    return decoded;
  }
}