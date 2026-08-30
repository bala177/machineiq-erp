import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { Role } from '../../common/enums';
import { MachineTemplatesService } from './machine-templates.service';
import { CreateMachineTemplateDto } from './machine-templates.dto';

@Controller('machine-templates')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MachineTemplatesController {
  constructor(private templatesService: MachineTemplatesService) {}

  @Get()
  findAll() {
    return this.templatesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templatesService.findById(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateMachineTemplateDto) {
    return this.templatesService.create(dto);
  }
}
