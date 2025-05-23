import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserStatus } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { Otp } from './entities/otp.entity';
import { OtpType } from './entities/otp.entity';

/**
 * OtpService
 * This service handles OTP-related operations such as verifying and resending OTPs.
 */
@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
  ) {}

  /**
   * verifyOtp
   * This method verifies the OTP for a given email address.
   */
  async verifyOtp(otp: string, email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['otps'],
    });

    if (!user) {
      throw new NotFoundException('User Not Found..!');
    }

    const newOtp = [...user.otps].pop();

    if (!newOtp || !newOtp.otp || !newOtp.otpExpiration || !newOtp.otp_type) {
      throw new BadRequestException(
        'Invalid OTP or OTP Expired or OTP Type Missing',
      );
    }

    if (new Date() > newOtp.otpExpiration) {
      await this.otpRepository.delete(newOtp.id);
      throw new UnauthorizedException('OTP Expired. Please request a new one.');
    }

    if (newOtp.otp !== otp) {
      throw new BadRequestException('Incorrect OTP');
    }

    if (newOtp.otp_type === 'EMAIL_VERIFICATION') {
      user.status = UserStatus.ACTIVE;
    } else if (newOtp.otp_type === 'FORGOT_PASSWORD') {
      user.is_Verified = true;
    }

    newOtp.otp = null;
    newOtp.otpExpiration = null;
    newOtp.otp_type = null;

    await this.otpRepository.delete(newOtp.id);
    await this.userRepository.save(user);

    return { message: 'OTP Verified Successfully' };
  }

  /**
   * resendOtp
   * This method resends the OTP to the user's email address.
   */
  async resendOtp(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['otps'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let otpType: OtpType;

    if (user.status === UserStatus.INACTIVE) {
      otpType = OtpType.EMAIL_VERIFICATION;
    } else if (user.status === UserStatus.ACTIVE && !user.is_logged_in) {
      otpType = OtpType.FORGOT_PASSWORD;
    } else {
      return {
        message: 'You are already logged in! Use Change Password instead.',
      };
    }

    // Generate and save the new OTP
    const otp = this.generateOtp();
    const otpExpiration = this.getOtpExpiration();

    const newOtp = this.otpRepository.create({
      otp,
      otpExpiration,
      otp_type: otpType,
      user,
    });

    await this.otpRepository.save(newOtp);

    return {
      message: `New OTP sent to your email for ${otpType === OtpType.EMAIL_VERIFICATION ? 'Email Verification' : 'Forgot Password'}!`,
    };
  }

  /**
   * generateOtp
   * This method generates a random 6-digit OTP.
   */
  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * getOtpExpiration
   * This method returns the expiration date and time for the OTP.
   */
  getOtpExpiration(): Date {
    return new Date(Date.now() + 2 * 60 * 1000); // 2 minutes expiration
  }
}
