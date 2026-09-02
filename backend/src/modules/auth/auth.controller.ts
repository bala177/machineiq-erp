import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { Role } from '../../common/enums';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, ChangePasswordDto, SetupDto } from './auth.dto';
import { CurrentUser } from '../../decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // 30 attempts per minute — still brute-force resistant, comfortable for active development
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  // Public and side-effect-free — safe to call on every page load to decide
  // whether to show the setup wizard or the login screen.
  @Get('setup/status')
  getSetupStatus() {
    return this.authService.getSetupStatus();
  }

  // Public by necessity (there's no admin to authenticate as yet), but
  // gated server-side in AuthService.setup() on "does any user exist" —
  // works exactly once per deployment, permanently, no config flag.
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @Post('setup')
  setup(@Body() dto: SetupDto) {
    return this.authService.setup(dto);
  }

  // Admin-only: this used to be public, which let any caller self-register
  // as admin (role came straight from the request body with no guard).
  // Only caller today is the authenticated "Add User" screen
  // (frontend/src/app/(app)/admin/users/page.tsx), which already sends an
  // admin JWT — this guard changes nothing for that screen.
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @Post('register')
  register(@Body() dto: RegisterDto, @CurrentUser('userId') userId: string) {
    return this.authService.register(dto, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @Post('change-password')
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword(req.user.userId ?? req.user.sub, dto.currentPassword, dto.newPassword);
    return { message: 'Password updated successfully' };
  }
}
