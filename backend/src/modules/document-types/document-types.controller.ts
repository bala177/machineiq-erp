import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../../common/enums';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { RequirePermissions } from '../../decorators/permissions.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { CreateDocumentTypeDto, UpdateDocumentTypeDto } from './document-types.dto';
import { DocumentTypesService } from './document-types.service';

@Controller('document-types')
@UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN)
export class DocumentTypesController {
  constructor(private documentTypesService: DocumentTypesService) {}
  @Get() findAll() { return this.documentTypesService.findAll(); }
  @Post() @RequirePermissions('document-types.manage') create(@Body() dto: CreateDocumentTypeDto, @CurrentUser('userId') userId: string) { return this.documentTypesService.create(dto, userId); }
  @Patch(':id') @RequirePermissions('document-types.manage') update(@Param('id') id: string, @Body() dto: UpdateDocumentTypeDto, @CurrentUser('userId') userId: string) { return this.documentTypesService.update(id, dto, userId); }
  @Delete(':id') @RequirePermissions('document-types.manage') remove(@Param('id') id: string, @CurrentUser('userId') userId: string) { return this.documentTypesService.remove(id, userId); }
}
