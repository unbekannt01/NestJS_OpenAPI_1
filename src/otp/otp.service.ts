import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserStatus } from 'src/user/entities/user.entity';
import { DeleteResult, Repository } from 'typeorm';
import { Otp, OtpType } from './entities/otp.entity';
import { LessThan } from 'typeorm';
import { otpExpiryConfig } from 'src/config/email.config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailServiceForOTP } from './services/email.service';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    private readonly email: EmailServiceForOTP
  ) {}

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

    const otpCode = this.generateOtp();
    const otpExpiration = this.getOtpExpiration();

    const newOtp = this.otpRepository.create({
      otp: otpCode,
      otpExpiration,
      otp_type: otpType,
      user,
    });

    await this.otpRepository.save(newOtp);

    // ✅ Send email based on type
    await this.email.sendOtpEmail(
      user.email,
      otpCode,
      user.first_name,
    );

    return {
      message: `New OTP sent to your email for ${
        otpType === OtpType.EMAIL_VERIFICATION
          ? 'Email Verification'
          : 'Forgot Password'
      }!`,
    };
  }

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  getOtpExpiration(): Date {
    return new Date(Date.now() + otpExpiryConfig.expirationOtp); // 2 minutes expiration
  }

  async deleteExpiredOtps(cutoffDate: Date): Promise<DeleteResult> {
    return await this.otpRepository.delete({
      createdAt: LessThan(cutoffDate),
    });
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async cleanupExpiredOtps() {
    const expirationTime = new Date(Date.now() - otpExpiryConfig.expirationOtp);
    const result = await this.deleteExpiredOtps(expirationTime);

    if ((result?.affected ?? 0) > 0) {
      console.log(`Cleaned up ${result.affected} expired OTPs`);
    }
  }
}
