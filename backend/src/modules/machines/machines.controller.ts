import { BadRequestException, Controller, Delete, Get, Post, Patch, Param, Body, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { MachinesService } from './machines.service';

@Controller('machines')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MachinesController {
  constructor(private machinesService: MachinesService) {}

  // --- Machines ---
  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.DESIGNER)
  createMachine(@Body() dto: any, @CurrentUser('userId') userId: string) {
    return this.machinesService.createMachine(dto, userId);
  }

  @Get()
  findMachines(@Query('projectId') projectId?: string) {
    return this.machinesService.findMachines(projectId);
  }

  @Get('projects/:projectId/modules')
  findProjectModules(@Param('projectId') projectId: string) {
    return this.machinesService.getProjectModules(projectId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DESIGNER)
  updateMachine(@Param('id') id: string, @Body() dto: any, @CurrentUser('userId') userId: string) {
    return this.machinesService.updateMachine(id, dto, userId);
  }

  @Get(':id/tree')
  getMachineTree(@Param('id') id: string): Promise<any> {
    return this.machinesService.getMachineTree(id);
  }

  @Get(':id/stats')
  getMachineStats(@Param('id') id: string) {
    return this.machinesService.getMachineStats(id);
  }

  // --- Units ---
  @Post(':machineId/units')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DESIGNER)
  createUnit(@Param('machineId') machineId: string, @Body() dto: any, @CurrentUser('userId') userId: string) {
    return this.machinesService.createUnit(machineId, dto, userId);
  }

  @Get(':machineId/units')
  findUnits(@Param('machineId') machineId: string) {
    return this.machinesService.findUnitsByMachine(machineId);
  }

  @Patch('units/:id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DESIGNER)
  updateUnit(@Param('id') id: string, @Body() dto: any, @CurrentUser('userId') userId: string) {
    return this.machinesService.updateUnit(id, dto, userId);
  }

  @Post('units/:id/release-to-procurement')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DESIGNER)
  releaseUnitToProcurement(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.machinesService.releaseUnitToProcurement(id, userId);
  }

  @Post('units/reorder')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DESIGNER)
  reorderUnits(@Body() dto: { ids: string[] }) {
    return this.machinesService.reorderUnits(dto.ids);
  }

  @Post('equipment-modules/reorder')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DESIGNER)
  reorderEquipmentModules(@Body() dto: { ids: string[] }) {
    return this.machinesService.reorderEquipmentModules(dto.ids);
  }

  @Post('control-modules/reorder')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DESIGNER)
  reorderControlModules(@Body() dto: { ids: string[] }) {
    return this.machinesService.reorderControlModules(dto.ids);
  }

  @Delete('units/:id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DESIGNER)
  deleteUnit(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.machinesService.deleteUnit(id, userId);
  }

  // --- Equipment Modules ---
  @Post('units/:unitId/equipment-modules')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DESIGNER)
  createEquipmentModule(@Param('unitId') unitId: string, @Body() dto: any, @CurrentUser('userId') userId: string) {
    return this.machinesService.createEquipmentModule(unitId, dto, userId);
  }

  @Get('units/:unitId/equipment-modules')
  findEquipmentModules(@Param('unitId') unitId: string) {
    return this.machinesService.findEquipmentModulesByUnit(unitId);
  }

  @Patch('equipment-modules/:id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DESIGNER)
  updateEquipmentModule(@Param('id') id: string, @Body() dto: any, @CurrentUser('userId') userId: string) {
    return this.machinesService.updateEquipmentModule(id, dto, userId);
  }

  @Delete('equipment-modules/:id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DESIGNER)
  deleteEquipmentModule(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.machinesService.deleteEquipmentModule(id, userId);
  }

  // --- Control Modules ---
  @Post('equipment-modules/:equipmentModuleId/control-modules')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DESIGNER)
  createControlModule(@Param('equipmentModuleId') equipmentModuleId: string, @Body() dto: any, @CurrentUser('userId') userId: string) {
    return this.machinesService.createControlModule(equipmentModuleId, dto, userId);
  }

  @Get('equipment-modules/:equipmentModuleId/control-modules')
  findControlModules(@Param('equipmentModuleId') equipmentModuleId: string) {
    return this.machinesService.findControlModulesByEquipmentModule(equipmentModuleId);
  }

  @Patch('control-modules/:id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DESIGNER)
  updateControlModule(@Param('id') id: string, @Body() dto: any, @CurrentUser('userId') userId: string) {
    return this.machinesService.updateControlModule(id, dto, userId);
  }

  @Delete('control-modules/:id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DESIGNER)
  deleteControlModule(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.machinesService.deleteControlModule(id, userId);
  }

  @Post(':id/import')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DESIGNER)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  importTree(
    @Param('id') id: string,
    @UploadedFile() file: { buffer: Buffer; originalname: string },
    @CurrentUser('userId') userId: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.machinesService.importTree(id, file.buffer, userId);
  }
}
