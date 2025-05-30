import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { TaskSchedulerService } from "./services/task-scheduler.service"
import { RequestLog } from "../admin/entity/log.entity"
import { Otp } from "../otp/entities/otp.entity"
import { EmailVerification } from "../email-verification-by-link/entity/email-verify.entity"
import { User } from "../user/entities/user.entity"
import { EmailServiceForOTP } from "../otp/services/email.service"
import { EmailServiceForVerifyMail } from "../email-verification-by-link/services/email-verify.service"
import { EmailServiceForSupension } from "../auth/services/suspend-mail.service"

/**
 * CommonModule
 * This module contains all shared services, utilities, and common functionality
 * that can be used across the entire application.
 */
@Module({
  imports: [TypeOrmModule.forFeature([RequestLog, Otp, EmailVerification, User])],
  providers: [TaskSchedulerService, EmailServiceForOTP, EmailServiceForVerifyMail, EmailServiceForSupension],
  exports: [
    TaskSchedulerService,
    EmailServiceForOTP,
    EmailServiceForVerifyMail,
    EmailServiceForSupension,
  ],
})
export class CommonModule {}
