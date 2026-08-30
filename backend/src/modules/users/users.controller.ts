import { Controller, Get, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { Role } from '../../common/enums';
import { UsersService } from './users.service';
import { UpdateUserDto } from './users.dto';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  // All authenticated roles can list users — needed for participant pickers across the app.
  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.SALES, Role.DESIGNER, Role.LEADERSHIP)
  findAll(@Query() query: { role?: string; departmentId?: string }) {
    return this.usersService.findAll(query);
  }

  // Any authenticated user can look up a user profile (for display purposes)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
