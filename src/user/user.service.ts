import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { OtpType, User, UserRole } from './entities/user.entity';
import { CreateUserDto } from 'src/auth/dto/create-user.dto';
import { EmailService } from './services/email.service';
import { Cron } from '@nestjs/schedule';
import { SmsService } from 'src/user/services/sms.service';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class UserService {
  constructor(
  @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly authService: AuthService,
  ) { }

  @Cron('* * * * * *') // Runs every second (adjust for production)
  async clearExpiredOtps() {
    const now = new Date();
    await this.userRepository.update(
      { otpExpiration: LessThan(now) },
      { otp: null, otpExpiration: null, otp_type: null },
    );
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
        user.otp = this.generateOtp();
        user.otpExpiration = this.getOtpExpiration();
        user.otp_type = OtpType.EMAIL_VERIFICATION;
      }
    } else {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      user = this.userRepository.create({
        ...createUserDto,
        password: hashedPassword,
        status: 'INACTIVE',
        otp: this.generateOtp(),
        otpExpiration: this.getOtpExpiration(),
        otp_type: OtpType.EMAIL_VERIFICATION,
        role: UserRole.USER
      });
    }
    const role = user.role;

    await this.userRepository.save(user);

    // Send OTP via Email only (no SMS during registration)
    await this.emailService.sendOtpEmail(user.email, user.otp || '', user.first_name);
    return { mesaage: `${role} registered successfully. OTP sent to email.` };
  }

  async verifyOtp(otp: string, email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException("User Not Found..!");
    }

    if (!user.otp || !user.otpExpiration || !user.otp_type) {
      console.log("Invalid OTP or OTP Type Missing");
      throw new BadRequestException("Invalid OTP or OTP Type Missing");
    }

    if (new Date() > user.otpExpiration) {
      console.log("OTP Expired");
      user.otp = null;
      user.otpExpiration = null;
      user.otp_type = null;
      await this.userRepository.save(user);
      throw new UnauthorizedException("OTP Expired. Please request a new one.");
    }

    if (user.otp !== otp) {
      console.log("Incorrect OTP");
      throw new BadRequestException("Incorrect OTP");
    }

    if (user.otp_type === "EMAIL_VERIFICATION") {
      user.status = "ACTIVE";
    } else if (user.otp_type === "FORGOT_PASSWORD") {
      user.is_Verified = true;
    }

    user.otp = null;
    user.otpExpiration = null;
    user.otp_type = null;
    await this.userRepository.save(user);

    // console.log("OTP Verified Successfully");
    return { message: "OTP Verified Successfully" };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User Not Found..!');
    }

    if (user.is_logged_in === false) {
      user.otp = this.generateOtp();
      user.otpExpiration = this.getOtpExpiration();
      user.otp_type = OtpType.FORGOT_PASSWORD;
      user.is_Verified = false;

      await this.userRepository.save(user);

      // Send OTP via Email
      await this.emailService.sendOtpEmail(
        user.email,
        user.otp,
        user.first_name,
      );

      // Send OTP via SMS if mobile_no is provided
      let smsResult = { message: 'SMS not sent', phoneNumber: '' };
      if (user.mobile_no) {
        try {
          smsResult = await this.smsService.sendOtpSms(user.mobile_no, user.otp || '');
          // console.log(`SMS sent to: ${smsResult.phoneNumber}`);
        } catch (error) {
          // console.warn(`Failed to send SMS to ${user.mobile_no}: ${error.message}`);
        }
      } else {
        // console.warn(`No mobile number provided for user ${user.email}. SMS not sent.`);
      }

      return { message: 'OTP Sent to Your Email and SMS (if mobile provided)' };
    } else {
      throw new UnauthorizedException(
        'User has Already LoggedIn, In this case user can use change password!',
      );
    }
  }

  async resetPassword(email: string, newpwd: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User Not Registered!');
    }

    if (!user.is_Verified) {
      throw new UnauthorizedException(
        'Please Verify OTP Before Resetting Password',
      );
    }

    if (user.is_logged_in === true) {
      throw new UnauthorizedException(
        'You do not have access to Reset the Password!',
      );
    }

    const sameresetpwd = await bcrypt.compare(newpwd, user.password);
    if (sameresetpwd) {
      throw new UnauthorizedException(
        'New Password cannot be the same as the old Password!',
      );
    }

    user.password = await bcrypt.hash(newpwd, 10);
    user.is_Verified = false;
    user.otp = null;
    user.otpExpiration = null;
    user.otp_type = null;

    await this.userRepository.save(user);

    return { message: 'Password Reset Successfully. Now You Can Login' };
  }

  async resendOtp(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status === 'INACTIVE') {
      user.otp = this.generateOtp();
      user.otpExpiration = this.getOtpExpiration();
      user.otp_type = OtpType.EMAIL_VERIFICATION;
      await this.userRepository.save(user);

      // Send OTP via Email only (no SMS)
      await this.emailService.sendOtpEmail(
        user.email,
        user.otp || '',
        user.first_name,
      );

      return { message: 'New OTP sent to your email for Email Verification!' };
    }

    if (user.status === 'ACTIVE' && user.is_logged_in === false) {
      user.otp = this.generateOtp();
      user.otpExpiration = this.getOtpExpiration();
      user.otp_type = OtpType.FORGOT_PASSWORD;
      await this.userRepository.save(user);

      // Send OTP via Email only (no SMS)
      await this.emailService.sendOtpEmail(
        user.email,
        user.otp || '',
        user.first_name,
      );

      return { message: 'New OTP sent to your email for Forgot Password!' };
    }

    if (user.status === 'ACTIVE' && user.is_logged_in === true) {
      return {
        message: 'You are already logged in! Use Change Password instead.',
      };
    }
  }
  
  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: ["first_name", "last_name", "mobile_no", "email", "status", "userName"],
    });
  }

  // async update(id: string, updateuserDto: UpdateUserDto) {
  //   const user = await this.userRepository.findOne({ where: { id } });

  //   if (!user) {
  //     throw new NotFoundException('User not found!');
  //   }

  //   if (!user.is_logged_in) {
  //     throw new InternalServerErrorException('User Not Logged In');
  //   }

  //   if (updateuserDto.first_name) user.first_name = updateuserDto.first_name;
  //   if (updateuserDto.last_name) user.last_name = updateuserDto.last_name;
  //   if (updateuserDto.mobile_no) user.mobile_no = updateuserDto.mobile_no;

  //   await this.userRepository.save(user);

  //   return { message: 'User updated successfully!' };
  // }

  async update(email: string, first_name: string, last_name: string, mobile_no: string, userName: string) {
    const user = await this.userRepository.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    if (!user.is_logged_in) {
      throw new UnauthorizedException('User is not logged in.');
    }

    console.log("Before update:", user); // Debugging

    user.first_name = first_name?.trim() || user.first_name;
    user.last_name = last_name?.trim() || user.last_name;
    user.mobile_no = mobile_no?.trim() || user.mobile_no;
    user.userName = userName?.trim() || user.userName;

    try {
      await this.userRepository.save(user);
      console.log("After update:", user); // Debugging

      return { message: 'User updated successfully!', user };
    } catch (error) {
      console.error("Update failed:", error);
      // throw new InternalServerErrorException('Failed to update user. Please try again.');
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.find(); // Fetches all users
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private getOtpExpiration(): Date {
    return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration
  }
}