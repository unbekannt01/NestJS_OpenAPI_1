import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from 'src/user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) { }

//   async login(email: string, password: string) {
//     const user = await this.userRepository.findOne({ where: { email } });

//     if (!user) {
//       throw new NotFoundException('User not registered.');
//     }

//     const isValidPassword = await bcrypt.compare(password, user.password);
//     if (!isValidPassword) {
//       throw new UnauthorizedException('Wrong Credentials.');
//     }

//     const role = user.role;
//     user.is_logged_in = true;
//     await this.userRepository.save(user);

//     // Generate JWT Token
//     const token = await this.generateUserToken(user.id, user.role);

//     return { message: `${role} Login Successfully!`, ...token };
//   }



  async logout(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User Not Found!');
    }

    if (user.is_logged_in === false) {
      throw new UnauthorizedException('User Already Logged Out!');
    }

    user.is_logged_in = false;
    user.token = null; // Clear the token on logout
    user.expiryDate_token = null; // Clear the token expiration date on logout
    await this.userRepository.save(user);

    return { message: 'User Logout Successfully!' };
  }

  async changepwd(email: string, password: string, newpwd: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Email is Invalid!');
    }

    if (!user.is_logged_in) {
      throw new UnauthorizedException('Please Login First!');
    }

    const oldpwd = await bcrypt.compare(password, user.password);
    if (!oldpwd) {
      throw new UnauthorizedException('Invalid old password!');
    }

    const samepwd = await bcrypt.compare(newpwd, user.password);
    if (samepwd) {
      throw new UnauthorizedException(
        'New password cannot be the same as the old password!',
      );
    }

    user.password = await bcrypt.hash(newpwd, 10);
    await this.userRepository.save(user);

    return { message: 'User Successfully Changed their Password!' };
  }

  async generateUserToken(userId: string, role: UserRole) {
    const payload = {
      id: userId,
      UserRole: role, // Ensure the role field is named 'role'
    };

    const secret = process.env.JWT_SECRET; // Fallback for missing secret
    // console.log('Using JWT_SECRET:', secret); // Debugging

    const access_token = this.jwtService.sign(payload, { secret });
    const refresh_token = uuidv4();
    await this.storeRefreshToken(refresh_token, userId, role);
    return {
      access_token,
      refresh_token,
    };
  }

  async storeRefreshToken(token: string, userId: string, role: UserRole) {
    const expiresIn = new Date();
    expiresIn.setDate(expiresIn.getDate() + 7); // 7 days expiration

    await this.userRepository.update(
      { id: userId },
      { token, role, expiryDate_token: expiresIn },
    );
  }

  async refreshToken(refresh_token: string) {
    const token = await this.userRepository.findOne({
      where: {
        token: refresh_token,
        expiryDate_token: MoreThanOrEqual(new Date()),
      },
    });

    if (!token) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    return this.generateUserToken(token.id, token.role);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });

      if (!user) {
        console.log('User not found'); // Debugging
        return null;
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        console.log('Invalid password'); // Debugging
        return null;
      }

      return user;
    } catch (error) {
      console.error('Error in validateUser:', error); // Debugging
      return null;
    }
  }
}