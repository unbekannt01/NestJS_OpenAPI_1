import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async save(createUserDto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email Already Registered');
    }
    
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    await this.userRepository.save(user);
    const payload = { id: user.id, email: user.email };
    const token = await this.jwtService.signAsync(payload);

    return { message: 'User Registered Successfully', token };
  }

  async login(email: string, password: string, token: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!token) {
      throw new UnauthorizedException('Please Verify the Token First!');
    }

    try {
      const payload = this.jwtService.verify(token);
      // console.log('Verified Token...');
    } catch (e) {
      throw new UnauthorizedException('Invalid or Expired Token!');
    }

    if (!user) {
      throw new UnauthorizedException('Invalid Email!');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid Password!');
    }
    return { message: 'User Login Successfully !' };
  } 

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }
}
