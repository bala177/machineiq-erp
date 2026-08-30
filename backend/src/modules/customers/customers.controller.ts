import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../guards/roles.guard';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { Role } from '../../common/enums';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './customers.dto';

@Controller('customers')
@UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SALES)
  @RequirePermissions('customers.manage')
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Post('import')
  @Roles(Role.ADMIN, Role.SALES)
  @RequirePermissions('customers.manage')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  bulkImport(@UploadedFile() file: { buffer: Buffer; originalname: string }) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.customersService.bulkImport(file.buffer, file.originalname);
  }

  @Get()
  findAll(@Query('search') search?: string) {
    return this.customersService.findAll({ search });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SALES)
  @RequirePermissions('customers.manage')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SALES)
  @RequirePermissions('customers.manage')
  remove(@Param('id') id: string) {
    return this.customersService.softDelete(id);
  }
}
