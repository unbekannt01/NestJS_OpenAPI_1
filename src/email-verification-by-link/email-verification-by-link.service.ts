import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from 'src/auth/dto/create-user.dto';
import { checkIfSuspended } from 'src/common/utils/user-status.util';
import { User, UserRole, UserStatus } from 'src/user/entities/user.entity';
import { EmailServiceForVerifyMail } from './services/email.service';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmailVerificationByLinkService {
    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        private readonly configService: ConfigService,
        private readonly emailService: EmailServiceForVerifyMail
    ) { }

    // After Register sent a Verification Mail 
    async save(createUserDto: CreateUserDto) {
        const normalizedEmail = createUserDto.email.toLowerCase();
        const normalizedUserName = createUserDto.userName.toLowerCase();

        // Check for existing user (including soft-deleted) by normalized email
        let user = await this.userRepository.findOne({
            where: { email: normalizedEmail },
            withDeleted: true,
        });

        if (user) {
            checkIfSuspended(user);
        }

        // Always check for username conflict (including soft-deleted) by normalized username
        const usernameConflict = await this.userRepository.findOne({
            where: { userName: normalizedUserName },
            withDeleted: true,
        });

        if (usernameConflict && (!user || usernameConflict.id !== user.id)) {
            throw new ConflictException('This username is already taken. Please choose another username or contact support to restore your account.');
        }

        if (user) {
            if (user.status === 'ACTIVE') {
                throw new ConflictException('Email already registered...!');
            }
        } else {
            const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
            const verificationToken = uuidv4(); // Generate UUID token for email verification
            user = this.userRepository.create({
                ...createUserDto,
                email: normalizedEmail,
                userName: normalizedUserName,
                password: hashedPassword,
                status: UserStatus.INACTIVE,
                verificationToken, // Store the verification token
                tokenExpiration: new Date(Date.now() + 24 * 60 * 60 * 1000), // Token expires in 24 hours
                role: UserRole.USER,
                birth_date: createUserDto.birth_date || undefined,
                createdAt: new Date(),
                createdBy: createUserDto.userName,
            });
        }

        if (user.birth_date) {
            const today = new Date();
            const birthDate = new Date(user.birth_date);
            let age = today.getFullYear() - birthDate.getFullYear();
            user.age = age;
            await this.userRepository.save(user);
        }

        await this.userRepository.save(user);

        // Send verification email with link
        const FRONTEND_BASE_URL = this.configService.get<string>('FRONTEND_BASE_URL');
        if (!FRONTEND_BASE_URL) {
            throw new Error('FRONTEND_BASE_URL is not defined in environment variables');
        }
        const verificationLink = `${FRONTEND_BASE_URL}/verify-email?token=${user.verificationToken}`;
        await this.emailService.sendVerificationEmail(user.email, verificationLink, user.first_name);

        return { message: `${user.role} registered successfully. Verification link sent to email.` };
    }

    async findByVerificationToken(token: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { verificationToken: token },
        });
    }

    async generateEmailVerificationToken(): Promise<string> {
        const token = uuidv4();
        return token;
    }

    async resendVerificationEmail(email: string): Promise<User | null> {
        const user = await this.userRepository.findOne({
            where: { email },
        });

        if (!user || user.status == UserStatus.ACTIVE) {
            throw new UnauthorizedException('User Already Verified..!'); // User not found or already verified
        }

        // Generate new verification token and expiration
        user.verificationToken = uuidv4();
        user.tokenExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiration
        await this.userRepository.save(user);

        // Send verification email
        const FRONTEND_BASE_URL = this.configService.get<string>('FRONTEND_BASE_URL');
        if (!FRONTEND_BASE_URL) {
            throw new Error('FRONTEND_BASE_URL is not defined in environment variables');
        }
        const verificationLink = `${FRONTEND_BASE_URL}/verify-email?token=${user.verificationToken}`;
        await this.emailService.sendVerificationEmail(user.email, verificationLink, user.first_name);

        return user;
    }
}
