import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { CaptchaGuard, CaptchaToken } from '.';

@Controller('auth')
export class AuthController {
  @Get('test')
  test() {
    return { 
      message: 'CAPTCHA module is working!',
      timestamp: new Date().toISOString()
    };
  }
 @Post('login')
  @UseGuards(CaptchaGuard) // this validates captcha token automatically
  login(@Body() body: any) {
    const { username, password } = body;

    // ✅ Simple dummy check for demonstration
    if (username === 'admin' && password === '1234') {
      return {
        success: true,
        message: 'Login successful',
      };
    }

    return {
      success: false,
      message: 'Invalid username or password',
    };
  }

  // Register route (also protected by captcha)
  @Post('register')
  @UseGuards(CaptchaGuard)
  register(@Body() body: any) {
    const { username, password, email } = body;

    // Dummy check: fail if username is "admin" (already taken)
    if (username === 'admin') {
      return {
        success: false,
        message: 'Username already taken',
      };
    }

    // Otherwise, return success (pretend user is created)
    return {
      success: true,
      message: 'User registered successfully',
      data: { username, email },
    };
  }

}
