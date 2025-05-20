import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserStatus } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Otp, OtpType } from 'src/otp/entities/otp.entity';
import { OtpService } from 'src/otp/otp.service';
import { EmailServiceForOTP } from 'src/otp/services/email.service';

@Injectable()
export class PasswordService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Otp) private readonly otpRepository: Repository<Otp>,
    private readonly otpService: OtpService,
    private readonly emailService: EmailServiceForOTP,
  ) {}

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

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['otps'],
    });
    if (!user) {
      throw new NotFoundException('User Not Found..!');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException(
        'You are Supsended. Please Contact Support Team...!',
      );
    }

    if (user.is_logged_in === false) {
      const otp = this.otpService.generateOtp();
      const otpExpiration = this.otpService.getOtpExpiration();

      const otpRecord = new Otp();
      otpRecord.otp = otp;
      otpRecord.otpExpiration = otpExpiration;
      otpRecord.otp_type = OtpType.FORGOT_PASSWORD;
      otpRecord.user = user; // associate OTP with the user

      await this.otpRepository.save(otpRecord);

      // Send OTP via Email
      await this.emailService.sendOtpEmail(
        user.email,
        otpRecord.otp,
        user.first_name,
      );

      //   // Send OTP via SMS if mobile_no is provided
      //   let smsResult = { message: 'SMS not sent', phoneNumber: '' };
      //   if (user.mobile_no) {
      //     try {
      //       smsResult = await this.smsService.sendOtpSms(user.mobile_no, user.otp || '');
      //     } catch (error) {
      //     }
      //   } else {
      //     console.log('No mobile number provided for SMS OTP.');
      //   }

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
      throw new NotFoundException('User Not Found...!');
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

    // await this.authService.verifyPassword(newpwd, user.password);
    const isSame = await bcrypt.compare(newpwd, user.password);
    if (isSame) {
      throw new UnauthorizedException(
        'New Password cannot be the same as the old Password!',
      );
    }

    const otpRecord = new Otp();

    user.password = await bcrypt.hash(newpwd, 10);
    user.is_Verified = false;
    otpRecord.otp = null;
    otpRecord.otpExpiration = null;
    otpRecord.otp_type = null;

    await this.userRepository.save(user);

    return { message: 'Password Reset Successfully. Now You Can Login' };
  }
}
