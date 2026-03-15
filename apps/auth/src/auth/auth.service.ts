// apps/auth/src/auth.service.ts
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    // Find user and explicitly include the password for comparison
    const user = await this.usersRepository.findOne({
      where: { email },
      select: ['id', 'password', 'role'],
    });

    if (user && (await bcrypt.compare(pass, user.password))) {
      // Don't return the password to the controller!
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async register(registerDto: RegisterDto): Promise<User> {
    const { email, password, role } = registerDto;

    // 1. Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // 2. Hash the password (Salt rounds = 10 is industry standard)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create and save the user
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      role: role || 'customer',
    });

    return await this.usersRepository.save(user);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      // For security, don't reveal that the user doesn't exist
      return;
    }

    // In a real application, you would generate a secure token here,
    // save it to the database with an expiration time,
    // and send an email to the user with a link containing the token.
    // For now, this is a mock implementation.
    console.log(`Mock: Password reset requested for ${email}`);
  }
}
