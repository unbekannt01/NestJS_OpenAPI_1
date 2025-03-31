import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { otp_type, User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { EmailService } from './email.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  @Cron('* * * * * *') // Runs every seconds
  async clearExpiredOtps() {
    const now = new Date();

    // Delete OTPs where otpExpiration is in the past
    await this.userRepository.update(
      { otpExpiration: LessThan(now) }, // Finds expired OTPs
      { otp: null, otpExpiration: null }, // Sets them to NULL
    );
  }

  async save(createUserDto: CreateUserDto) {
    let user = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (user) {
      if (user.status === 'ACTIVE') {
        throw new UnauthorizedException('Email already registered');
      }

      if (user.status === 'INACTIVE') {
        throw new UnauthorizedException('Please Verify Email !');
      }

      if (!user.otp) {
        user.otp = this.generateOtp();
        user.otpExpiration = this.getOtpExpiration();
        user.otp_type = otp_type.EMAIL_VERIFICATION; // Use the enum
      }
    } else {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      user = this.userRepository.create({
        ...createUserDto,
        password: hashedPassword,
        status: 'INACTIVE',
        otp: this.generateOtp(),
        otpExpiration: this.getOtpExpiration(),
      });
    }

    (user.otp_type = otp_type.EMAIL_VERIFICATION), // Use the enum
      await this.userRepository.save(user);
    await this.emailService.sendOtpEmail(
      user.email,
      user.otp || '',
      user.first_name,
    );

    return { message: 'User registered successfully. OTP sent to email.' };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    if (!user.otp || !user.otpExpiration || !user.otp_type) {
      throw new UnauthorizedException('Invalid OTP or OTP Type Missing');
    }

    if (new Date() > user.otpExpiration) {
      user.otp = null;
      user.otpExpiration = null;
      user.otp_type = null;
      await this.userRepository.save(user);
      throw new UnauthorizedException('OTP Expired. Please request a new one.');
    }

    if (user.otp !== otp) {
      throw new UnauthorizedException('Incorrect OTP');
    }

    // OTP is valid, process based on stored otp_type
    if (user.otp_type === otp_type.EMAIL_VERIFICATION) {
      user.status = 'ACTIVE';
    } else if (user.otp_type === otp_type.FORGOT_PASSWORD) {
      user.is_Verified = true;
    }

    // Clear OTP after successful verification
    user.otp = null;
    user.otpExpiration = null;
    user.otp_type = null;
    await this.userRepository.save(user);

    return { message: 'OTP Verified Successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User Not Registered');
    }

    if (user.status === 'INACTIVE') {
      throw new UnauthorizedException(
        'The user needs to activate their account first.',
      );
    }

    if (user.is_logged_in === false) {
      user.otp = this.generateOtp();
      user.otpExpiration = this.getOtpExpiration();
      user.otp_type = otp_type.FORGOT_PASSWORD; // Use the enum
      user.is_Verified = false;

      await this.userRepository.save(user);
      await this.emailService.sendOtpEmail(
        user.email,
        user.otp,
        user.first_name,
      );
    } else {
      throw new UnauthorizedException(
        'User has Already LoggedIn, In this case user can use change password !',
      );
    }

    return { message: 'OTP Sent to Your Email' };
  }

  async resetPassword(email: string, newpwd: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User Not Registered !');
    }

    if (!user.is_Verified) {
      throw new UnauthorizedException(
        'Please Verify OTP Before Resetting Password',
      );
    }

    if (user.is_logged_in === true) {
      throw new UnauthorizedException(
        'You have do not access to Reset the Password !',
      );
    }

    const sameresetpwd = await bcrypt.compare(newpwd, user.password);
    if (sameresetpwd) {
      throw new UnauthorizedException(
        'New Password cannot be the same as the old Password !',
      );
    }

    // Hash & update new password
    user.password = await bcrypt.hash(newpwd, 10);
    user.is_Verified = false; // Reset verification status
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
      user.otp_type = otp_type.EMAIL_VERIFICATION;
      await this.userRepository.save(user);
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
      user.otp_type = otp_type.FORGOT_PASSWORD;
      await this.userRepository.save(user);
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

    return { message: 'Something went wrong. Please try again later.' };
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not registered.');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Please verify your email first.');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid password.');
    }

    user.is_logged_in = true;
    user.is_logged_out = false;
    await this.userRepository.save(user);

    return { message: 'User Login Successfully !' };
  }

  async logout(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('User Not Found !');
    }

    if (user.status == 'INACTIVE') {
      throw new UnauthorizedException('User have to Login First !');
    }

    if (user.is_logged_out == true) {
      throw new UnauthorizedException('User Already Logout !');
    }

    user.is_logged_in = false;
    user.is_logged_out = true;
    await this.userRepository.save(user);

    return { message: 'User Logout Successfully !' };
  }

  async changepwd(email: string, password: string, newpwd: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Email is Invalid !');
    }

    if (!user?.is_logged_in === true) {
      throw new UnauthorizedException('Please Login First !');
    }

    const oldpwd = await bcrypt.compare(password, user.password);
    if (!oldpwd) {
      throw new UnauthorizedException('Invalid old password !');
    }

    const samepwd = await bcrypt.compare(newpwd, password);
    if (!samepwd) {
      throw new UnauthorizedException(
        'New password cannot be the same as the old password !',
      );
    }

    user.password = await bcrypt.hash(newpwd, 10);
    await this.userRepository.save(user);

    return { message: 'User Successfully Changed their Password !' };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private getOtpExpiration(): Date {
    return new Date(Date.now() + 2 * 60 * 1000);
  }
}
