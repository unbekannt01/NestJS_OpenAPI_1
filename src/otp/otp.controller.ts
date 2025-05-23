import { Body, Controller, Post } from '@nestjs/common';
import { OtpService } from './otp.service';
import { VerifyOTPDto } from './dto/verify-otp-user.dto';
import { ResendOTPDto } from './dto/resend-otp-user.dto';
import { Public } from 'src/common/decorators/public.decorator';

/**
 * OtpController handles OTP-related operations such as verifying and
 * resending OTPs.
 */
@Public()
@Controller({ path: 'otp', version: '1' })
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  /**
   * verifyOtp
   * This method verifies the OTP for a given email address.
   */
  @Post('verify-otp')
  verifyOtp(@Body() verifyOtpDto: VerifyOTPDto) {
    return this.otpService.verifyOtp(verifyOtpDto.otp, verifyOtpDto.email);
  }

  /**
   * resendOtp
   * This method resends the OTP to the user's email address.
   */
  @Post('resend-otp')
  resendOtp(@Body() { email }: ResendOTPDto) {
    return this.otpService.resendOtp(email);
  }
}
