import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { Role } from '../../common/enums';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @Roles(Role.ADMIN)
  getAll() {
    return this.settingsService.getAll();
  }

  @Get(':key')
  @Roles(Role.ADMIN, Role.MANAGER, Role.SALES, Role.LEADERSHIP)
  get(@Param('key') key: string) {
    return this.settingsService.get(key);
  }

  @Patch(':key')
  @Roles(Role.ADMIN)
  upsert(@Param('key') key: string, @Body() body: { value: any }) {
    return this.settingsService.upsert(key, body.value);
  }
}
