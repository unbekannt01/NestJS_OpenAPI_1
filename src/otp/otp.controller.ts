import { Body, Controller, Post } from '@nestjs/common';
import { OtpService } from './otp.service';
import { VerifyOTPDto } from './dto/verify-otp-user.dto'; 
import { ResendOTPDto } from './dto/resend-otp-user.dto'; 

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

    @Post("/verify-otp")
    async verifyOtp(@Body() verifyOtpDto: VerifyOTPDto) {
      // console.log("Received verify OTP request:", verifyOtpDto); // Add log
      return this.otpService.verifyOtp(verifyOtpDto.otp, verifyOtpDto.email);
    }
    
    @Post('/resend-otp')
    resendOtp(@Body() { email }: ResendOTPDto) {
      return this.otpService.resendOtp(email);
    }
}
