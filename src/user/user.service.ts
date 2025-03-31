import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { EmailService } from './email.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService
  ) { }

  @Cron('* * * * * *')  // Runs every seconds
  async clearExpiredOtps() {
    const now = new Date();

    // Delete OTPs where otpExpiration is in the past
    await this.userRepository.update(
      { otpExpiration: LessThan(now) }, // Finds expired OTPs
      { otp: null, otpExpiration: null } // Sets them to NULL
    );
  }

  async save(createUserDto: CreateUserDto) {
    let user = await this.userRepository.findOne({ where: { email: createUserDto.email } });

    if (user) {
      if (user.status === 'ACTIVE') {
        throw new UnauthorizedException('Email already registered');
      }

      if (user.status === 'INACTIVE') {
        throw new UnauthorizedException('Please Verify Email !')
      }

      // Generate new OTP only if it was expired or null
      if (!user.otp) {
        user.otp = this.generateOtp();
        user.otpExpiration = this.getOtpExpiration();
      }
    } else {
      // Create a new user
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      user = this.userRepository.create({
        ...createUserDto,
        password: hashedPassword,
        status: 'INACTIVE',
        otp: this.generateOtp(),
        otpExpiration: this.getOtpExpiration(),
      });
    }

    await this.userRepository.save(user);
    await this.emailService.sendOtpEmail(user.email, user.otp || '', user.first_name);

    return { message: 'User registered successfully. OTP sent to email.' };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user || !user.otp || !user.otpExpiration) {
      throw new UnauthorizedException('OTP not found. Please request a new one.');
    }

    if (new Date() > user.otpExpiration) {
      // OTP is expired, so clear it
      user.otp = null;
      user.otpExpiration = null;
      await this.userRepository.save(user);

      throw new UnauthorizedException('OTP expired. Please request a new one.');
    }

    if (user.otp !== otp) {
      throw new UnauthorizedException('Incorrect OTP.');
    }

    // OTP is valid, activate user and clear OTP
    user.otp = null;
    user.otpExpiration = null;
    user.status = 'ACTIVE';
    await this.userRepository.save(user);

    return { message: 'OTP verified successfully. Account activated.' };
  }

  async resendOtp(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status === 'INACTIVE') {
      // Ensure new OTP is generated
      user.otp = this.generateOtp();
      user.otpExpiration = this.getOtpExpiration();
      await this.userRepository.save(user);
      await this.emailService.sendOtpEmail(user.email, user.otp || '', user.first_name);
      return { message: 'New OTP sent to your email' };
    }
    else {
      return { message: 'User Already Activated !' };
    }
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not registered.');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Please verify your email first.');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid password.');
    }

    user.is_logged_in = true;
    user.is_logged_out = false;
    await this.userRepository.save(user);

    return { message: 'User Login Successfully !' };
  }

  async logout(email: string) {
    const user = await this.userRepository.findOne({ where: { email } })

    if (!user) {
      throw new UnauthorizedException('User Not Found !')
    }

    user.is_logged_in = false;
    user.is_logged_out = true;
    await this.userRepository.save(user);

    return { message: 'User Logout Successfully !' }
  }

  async changepwd(email:string, password:string, newpwd:string){
    const user = await this.userRepository.findOne({ where : { email }})

    if(!user?.is_logged_in === true){
      throw new UnauthorizedException('Please Login !')
    }

    const oldpwd = await bcrypt.compare(password,user.password );
    if (!oldpwd) {
      throw new UnauthorizedException('Invalid old password !');
    }

    const samepwd = await bcrypt.compare(newpwd, password)
    if(!samepwd) {
      throw new UnauthorizedException('New password cannot be the same as the old password !')
    }

    user.password = await bcrypt.hash(newpwd,10);
    await this.userRepository.save(user); 

    return { message : 'User Successfully Changed their Password !'}
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private getOtpExpiration(): Date {
    return new Date(Date.now() + 2 * 60 * 1000);
  }
}
