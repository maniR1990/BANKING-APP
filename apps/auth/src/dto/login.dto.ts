// apps/auth/src/dto/login.dto.ts
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'john.doe@banking.com',
    description: 'The email address of the user',
  })
  @IsEmail({}, { message: 'Please provide a valid banking email' })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'The password for the account (Min 8 chars, 1 upper, 1 lower, 1 digit, 1 special)',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;
}

// apps/auth/src/dto/auth-response.dto.ts
export class AuthResponseDto {
  @ApiProperty({ example: 'uuid-123-456' })
  userId: string;

  @ApiProperty({ example: 'Registration successful' })
  message: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'jane.smith@banking.com' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Complex password requirement',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;

  @ApiProperty({ example: 'customer', required: false })
  @IsOptional()
  @IsString()
  role?: string; // Default will be 'customer' in the entity
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@banking.com' })
  @IsEmail({}, { message: 'Please provide a valid banking email' })
  email: string;
}
