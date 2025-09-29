import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

class LoginDto {
  username: string;
  password: string;
}

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Demo login (username must exist, password="password")' })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.username, body.password);
  }
}
