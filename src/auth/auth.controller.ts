import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { OnlyAnonymous } from '../static/decorators/auth.decorators';
import { AuthGuard } from './guards/auth.guard.service';

@Controller('auth')
@UseGuards(AuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @OnlyAnonymous()
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
