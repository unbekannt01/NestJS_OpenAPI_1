import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserStatus } from 'src/user/entities/user.entity';
import { EmailServiceForVerifyMail } from './services/email-verify.service';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { EmailVerification } from './entity/email-verify.entity';

@Injectable()
export class EmailVerificationByLinkService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(EmailVerification)
    private readonly emailVerifyRepository: Repository<EmailVerification>,
    private readonly configService: ConfigService,
    private readonly emailService: EmailServiceForVerifyMail,
  ) {}

  // Find verification record and return associated user
  async findByVerificationToken(token: string): Promise<User> {
    const verification = await this.emailVerifyRepository.findOne({
      where: { verificationToken: token },
      relations: ['user'],
    });

    if (!verification) {
      throw new NotFoundException('Invalid or expired verification token.');
    }

    if (
      !verification.tokenExpiration ||
      new Date() > verification.tokenExpiration
    ) {
      await this.emailVerifyRepository.delete(verification.id);
      throw new UnauthorizedException(
        'Token has expired. Please request a new verification link.',
      );
    }

    // Activate the user account
    const user = verification.user;
    user.status = UserStatus.ACTIVE;
    await this.userRepository.save(user);

    // Delete token after successful verification
    await this.emailVerifyRepository.delete(verification.id);

    return user;
  }

  // Generate and save token (you can use this in registration flow too)
  async generateEmailVerificationToken(user: User): Promise<string> {
    const token = uuidv4();
    const tokenExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const verification = this.emailVerifyRepository.create({
      user: user,
      verificationToken: token,
      tokenExpiration: tokenExpiration,
    });

    await this.emailVerifyRepository.save(verification);
    return token;
  }

  // Resend verification link
  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['emailVerifications'],
    });

    if (!user || user.status === UserStatus.ACTIVE) {
      throw new UnauthorizedException('User already verified or not found.');
    }

    // Optionally delete old verification tokens
    await this.emailVerifyRepository.delete({ user: { id: user.id } });

    // Create new verification token
    const token = await this.generateEmailVerificationToken(user);

    const FRONTEND_BASE_URL =
      this.configService.get<string>('FRONTEND_BASE_URL');
    if (!FRONTEND_BASE_URL) {
      throw new Error(
        'FRONTEND_BASE_URL is not defined in environment variables',
      );
    }

    const verificationLink = `${FRONTEND_BASE_URL}/verify-email?token=${token}`;
    await this.emailService.sendVerificationEmail(
      user.email,
      verificationLink,
      user.first_name,
    );
  }
}
