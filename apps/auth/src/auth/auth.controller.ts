import {
  Body,
  Controller,
  Delete,
  Post,
  Get,
  Req,
  Res,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import * as express from 'express';
import { v4 as uuid4 } from 'uuid';
import { AuthService } from './auth.service';
import { RedisService } from './../redis/redis.service';
import { LoginDto, RegisterDto, ForgotPasswordDto } from '../dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
@UsePipes(new ValidationPipe({ whitelist: true })) // Security: Strips non-DTO properties
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly redisService: RedisService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Log in to the application' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 201, description: 'Login successful, returns session cookie and user ID.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const { email, password } = loginDto;
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const sessionId = uuid4();
    await this.redisService.createSession(sessionId, user.id, 3600, {
      role: user.role,
    });

    res.cookie('banking_session', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour
    });

    return { userId: user.id, message: 'Login successful' };
  }

  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  @ApiResponse({ status: 409, description: 'Email already registered.' })
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);

    return {
      message: 'User created successfully',
      userId: user.id,
    };
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change user password' })
  @ApiCookieAuth('banking_session')
  @ApiResponse({ status: 201, description: 'Password changed successfully, all sessions invalidated.' })
  @ApiResponse({ status: 401, description: 'Not logged in or invalid session.' })
  async changePassword(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const sessionId = req.cookies['banking_session'];
    if (!sessionId) {
      throw new UnauthorizedException('Not logged in');
    }

    const sessionData = await this.redisService.getSession(sessionId);
    if (!sessionData || !sessionData.userId) {
      throw new UnauthorizedException('Invalid session');
    }

    // In a real app, you would validate the old password, hash the new one, and update the DB here.
    // await this.authService.changePassword(sessionData.userId, newPassword);

    // Invalidate all active sessions for this user ID from Redis
    await this.redisService.invalidateAllSessionsForUser(sessionData.userId);

    // Clear current cookie
    res.clearCookie('banking_session');

    return {
      message: 'Password changed successfully, all sessions invalidated',
    };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 201, description: 'Password reset link sent (mocked).' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Log out of the application' })
  @ApiCookieAuth('banking_session')
  @ApiResponse({ status: 201, description: 'Logout successful.' })
  async logout(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const sessionId = req.cookies['banking_session'];
    if (sessionId) {
      await this.redisService.deleteSession(sessionId);
      res.clearCookie('banking_session');
    }
    return { message: 'Logout successful' };
  }

  @Get('validate')
  @ApiOperation({ summary: 'Internal endpoint to validate session for NGINX auth_request guard' })
  @ApiCookieAuth('banking_session')
  @ApiResponse({ status: 200, description: 'Session valid, returns X-User-ID header.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async validateToken(
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    const sessionId = req.cookies['banking_session'];

    if (!sessionId) {
      // 401 tells Nginx to reject the proxy request
      return res.status(401).send('Unauthorized');
    }

    const sessionData = await this.redisService.getSession(sessionId);
    if (!sessionData || !sessionData.userId) {
      return res.status(401).send('Unauthorized');
    }

    // Refresh session TTL in Redis
    await this.redisService.refreshSession(sessionId, 3600);

    // Refresh cookie expiration
    res.cookie('banking_session', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour
    });

    // 200 tells Nginx to ALLOW the proxy request.
    // We attach the X-User-ID header so Nginx can pass it to the Account/Customer services!
    return res.status(200).header('X-User-ID', sessionData.userId).send();
  }
}
