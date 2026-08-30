import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ComponentAssemblyStatus,
  ComponentDesignStatus,
  ComponentDiscipline,
  ComponentProcurementStatus,
  MachineNodeType,
  ModuleComponentCategory,
  ModuleComponentStatus,
  ModuleCoordinationStatus,
  ModuleDepartment,
  Priority,
  TaskStatus,
} from '../../common/enums';
import { RolesGuard } from '../../guards/roles.guard';

@Controller('meta')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MachineMetaController {
  @Get('machine-architecture-enums')
  getMachineArchitectureEnums() {
    return {
      nodeTypes: Object.values(MachineNodeType),
      disciplines: Object.values(ComponentDiscipline),
      designStatuses: Object.values(ComponentDesignStatus),
      procurementStatuses: Object.values(ComponentProcurementStatus),
      assemblyStatuses: Object.values(ComponentAssemblyStatus),
      moduleDepartments: Object.values(ModuleDepartment),
      moduleStatuses: Object.values(ModuleCoordinationStatus),
      moduleComponentCategories: Object.values(ModuleComponentCategory),
      moduleComponentStatuses: Object.values(ModuleComponentStatus),
      taskStatuses: Object.values(TaskStatus),
      priorities: Object.values(Priority),
    };
  }
}
