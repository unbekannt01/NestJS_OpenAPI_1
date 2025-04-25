import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OtpType, User, UserStatus } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class OtpService {
    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>,
    ) { }

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
            user.status = UserStatus.ACTIVE;
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
            // await this.emailService.sendOtpEmail(
            //   user.email,
            //   user.otp || '',
            //   user.first_name,
            // );

            return { message: 'New OTP sent to your email for Email Verification!' };
        }

        if (user.status === 'ACTIVE' && user.is_logged_in === false) {
            user.otp = this.generateOtp();
            user.otpExpiration = this.getOtpExpiration();
            user.otp_type = OtpType.FORGOT_PASSWORD;
            await this.userRepository.save(user);

            // Send OTP via Email only (no SMS)
            // await this.emailService.sendOtpEmail(
            //   user.email,
            //   user.otp || '',
            //   user.first_name,
            // );

            return { message: 'New OTP sent to your email for Forgot Password!' };
        }

        if (user.status === 'ACTIVE' && user.is_logged_in === true) {
            return {
                message: 'You are already logged in! Use Change Password instead.',
            };
        }
    }

    generateOtp(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    getOtpExpiration(): Date {
        return new Date(Date.now() + 2 * 60 * 1000); // 2 minutes expiration
    }
}
