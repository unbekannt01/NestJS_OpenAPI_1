import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { OtpType, User } from './entities/user.entity';
import { EmailService } from './services/email.service';
import { SmsService } from 'src/user/services/sms.service';
import { AuthService } from 'src/auth/auth.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) { }

  // @Cron('* * * * * *') // Runs every second (adjust for production)
  // async clearExpiredOtps() {
  //   const now = new Date();
  //   await this.userRepository.update(
  //     { otpExpiration: LessThan(now) },
  //     { otp: null, otpExpiration: null, otp_type: null },
  //   );
  // }

  async verifyOtp(otp: string, email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException("User Not Found..!");
    }

    if (!user.otp || !user.otpExpiration || !user.otp_type) {
      // console.log("Invalid OTP or OTP Expired or OTP Type Missing");
      throw new BadRequestException("Invalid OTP or OTP Expired or OTP Type Missing");
    }

    if (new Date() > user.otpExpiration) {
      console.log("OTP Expired");
      user.otp = null;
      user.otpExpiration = null;
      user.otp_type = null;
      await this.userRepository.update(
        { email },
        { otp: null, otpExpiration: null, otp_type: null },
      );
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
        } catch (error) {
        }
      } else {
        console.log('No mobile number provided for SMS OTP.');
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

    await this.authService.verifyPassword(newpwd, user.password);
    if(newpwd === user.password) {
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

  async getUserById(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found!');
    }

    if (user.birth_date) {
      const today = new Date();
      const birthDate = new Date(user.birth_date);
      let age = today.getFullYear() - birthDate.getFullYear();
      // const monthDiff = today.getMonth() - birthDate.getMonth();
      
      user.age = age;
      await this.userRepository.save(user);
    }

    return this.userRepository.findOne({
      where: { id },
      select: ["first_name", "last_name", "mobile_no", "email", "status", "userName", "birth_date", "age"],
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

  async update(updateUserDto: UpdateUserDto, email: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    if (!user.is_logged_in) {
      throw new UnauthorizedException('User is not logged in.');
    }

    if (updateUserDto.first_name) user.first_name = updateUserDto.first_name;
    if (updateUserDto.last_name) user.last_name = updateUserDto.last_name;
    if (updateUserDto.userName) {
      // Check if the new username is already in use
      const existingUser = await this.userRepository.findOne({ where: { userName: updateUserDto.userName } });
      if (existingUser && existingUser.id !== user.id) {
        throw new ConflictException('Username already in use');
      }
      user.userName = updateUserDto.userName;
    }
    if (updateUserDto.mobile_no) user.mobile_no = updateUserDto.mobile_no;
    if (updateUserDto.birth_date) user.birth_date = updateUserDto.birth_date;

    await this.userRepository.save(user);

    const { id, password, status, otp, otpExpiration, otp_type, is_Verified, is_logged_in, role, token, expiryDate_token, age, ...data } = user;

    return { message: 'User updated successfully!', user: { data } };
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.find({
      select: ["role", "userName", "first_name", "last_name", "mobile_no", "email", "status", "token", "expiryDate_token"],
    }); // Fetches all users
  }

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  getOtpExpiration(): Date {
    return new Date(Date.now() + 1 * 60 * 1000); // 5 minutes expiration
  }
}