import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../../common/enums';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';
import { CreateItemCategoryDto, CreateItemDto, CreateUomDto, UpdateItemCategoryDto, UpdateItemDto, UpdateUomDto } from './items.dto';
import { ItemsService } from './items.service';

@Controller('items')
@UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
export class ItemsController {
  constructor(private itemsService: ItemsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @RequirePermissions('items.manage')
  create(@Body() dto: CreateItemDto, @CurrentUser('userId') userId: string) {
    return this.itemsService.createItem(dto, userId);
  }

  @Get()
  findAll(@Query('search') search?: string, @Query('categoryId') categoryId?: string, @Query('itemType') itemType?: string) {
    return this.itemsService.findItems({ search, categoryId, itemType });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @RequirePermissions('items.manage')
  update(@Param('id') id: string, @Body() dto: UpdateItemDto, @CurrentUser('userId') userId: string) {
    return this.itemsService.updateItem(id, dto, userId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @RequirePermissions('items.manage')
  remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.itemsService.deleteItem(id, userId);
  }

  @Post('categories')
  @Roles(Role.ADMIN, Role.MANAGER)
  @RequirePermissions('items.manage')
  createCategory(@Body() dto: CreateItemCategoryDto, @CurrentUser('userId') userId: string) {
    return this.itemsService.createCategory(dto, userId);
  }

  @Get('categories')
  findCategories() {
    return this.itemsService.findCategories();
  }

  @Patch('categories/:id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @RequirePermissions('items.manage')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateItemCategoryDto, @CurrentUser('userId') userId: string) {
    return this.itemsService.updateCategory(id, dto, userId);
  }

  @Delete('categories/:id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @RequirePermissions('items.manage')
  deleteCategory(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.itemsService.deleteCategory(id, userId);
  }

  @Post('uoms')
  @Roles(Role.ADMIN, Role.MANAGER)
  @RequirePermissions('items.manage')
  createUom(@Body() dto: CreateUomDto, @CurrentUser('userId') userId: string) {
    return this.itemsService.createUom(dto, userId);
  }

  @Get('uoms')
  findUoms() {
    return this.itemsService.findUoms();
  }

  @Patch('uoms/:id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @RequirePermissions('items.manage')
  updateUom(@Param('id') id: string, @Body() dto: UpdateUomDto, @CurrentUser('userId') userId: string) {
    return this.itemsService.updateUom(id, dto, userId);
  }

  @Delete('uoms/:id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @RequirePermissions('items.manage')
  deleteUom(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.itemsService.deleteUom(id, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itemsService.findItem(id);
  }
}
