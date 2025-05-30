import { Cron, CronExpression } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { otpExpiryConfig, emailTokenConfig } from 'src/config/email.config';
import type { OtpService } from 'src/otp/otp.service';
import type { EmailVerificationByLinkService } from 'src/email-verification-by-link/email-verification-by-link.service';
import type { AdminService } from 'src/admin/admin.service';

@Injectable()
export class TaskSchedulerService {
  private readonly logger = new Logger(TaskSchedulerService.name);

  constructor(
    private readonly otpService: OtpService,
    private readonly emailVerifyByLinkService: EmailVerificationByLinkService,
    private readonly adminService: AdminService,
  ) {}

  /**
   * Clean up expired OTPs every 5 minutes
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async cleanupExpiredOtps() {
    try {
      this.logger.log('Starting cleanup of expired OTPs');

      const expirationTime = new Date(
        Date.now() - otpExpiryConfig.expirationOtp,
      );
      const result = await this.otpService.deleteExpiredOtps(expirationTime);

      if ((result?.affected ?? 0) > 0) {
        this.logger.log(`Cleaned up ${result.affected} expired OTPs`);
      } else {
        this.logger.log('No expired OTPs found');
      }
    } catch (error) {
      this.logger.error('Error during OTP cleanup:', error);
    }
  }

  /**
   * Clean up expired email verification tokens every 10 minutes
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async cleanupExpiredEmailTokens() {
    try {
      this.logger.log('Starting cleanup of expired email verification tokens');

      const expirationTime = new Date(
        Date.now() - emailTokenConfig.expirationMs,
      );
      const result =
        await this.emailVerifyByLinkService.deleteExpiredToken(expirationTime);

      if ((result?.affected ?? 0) > 0) {
        this.logger.log(
          `Cleaned up ${result.affected} expired email verification tokens`,
        );
      } else {
        this.logger.log('No expired email verification tokens found');
      }
    } catch (error) {
      this.logger.error('Error during email token cleanup:', error);
    }
  }

  /**
   * Clean up old request logs every day at midnight
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async cleanupOldLogs() {
    try {
      this.logger.log('Starting cleanup of old request logs');

      await this.adminService.deleteAllLogs();
      this.logger.log('Successfully cleaned up request logs');
    } catch (error) {
      this.logger.error('Error during log cleanup:', error);
    }
  }
}
