export interface ProjectSummary {
  _id: string;
  name: string;
  health: string;
  stage: string;
  priority: string;
  targetDeliveryDate?: string;
  createdAt?: string;
  customer: string | null;
  projectManager: { firstName: string; lastName: string } | null;
  taskTotal: number;
  taskDone: number;
  taskBlocked: number;
  completionPct: number;
}

export interface AlertTask {
  _id: string;
  name: string;
  status: string;
  priority: string;
  dueDate?: string;
  ownerId?: { firstName: string; lastName: string } | null;
  projectId?: { _id: string; name: string } | null;
  departmentId?: { _id: string; name: string } | null;
}

export interface OpportunityPipeline {
  new: number;
  underReview: number;
  feasibility: number;
  approved: number;
  converted: number;
}

export interface ExecutiveDashboard {
  totalProjects: number;
  totalCustomers: number;
  totalMachines: number;
  totalComponents: number;
  totalModules: number;
  componentsByDesign: {
    notStarted: number;
    inDesign: number;
    underReview: number;
    released: number;
  };
  healthy: number;
  watch: number;
  atRisk: number;
  delayed: number;
  overdueTasks: number;
  blockedTasks: number;
  delayedComponents: number;
  modulesReadyForProcurement: number;
  blockedModules: number;
  longLeadRisks: number;
  departmentBottlenecks: { _id: string; departmentName: string; count: number }[];
  projects: ProjectSummary[];
  alertTasks: AlertTask[];
  opportunityPipeline: OpportunityPipeline;
}

export interface OpportunityItem {
  _id: string;
  title: string;
  status: string;
  priority?: string;
  machineVertical?: string;
  machineCategory?: string;
  customerId?: { name: string } | null;
  ownerId?: { firstName: string; lastName: string } | null;
  updatedAt?: string;
  createdAt?: string;
  estimatedValue?: number;
}

export interface ProcurementDashboard {
  statusBreakdown: { _id: string; count: number }[];
  longLeadItems: {
    _id: string;
    name: string;
    status: string;
    leadTimeWeeks?: number;
    projectId?: { name: string } | null;
    supplierId?: { name: string } | null;
  }[];
  changedAfterRelease: {
    _id: string;
    name: string;
    status: string;
    projectId?: { name: string } | null;
    updatedAt?: string;
  }[];
}

export interface MyTask {
  _id: string;
  name: string;
  status: string;
  priority: string;
  dueDate?: string;
  projectId?: { _id: string; name: string } | null;
  departmentId?: { _id: string; name: string } | null;
}

export interface DeptDashboard {
  totalTasks: number;
  dueThisWeek: number;
  overdue: number;
  blocked: number;
  statusBreakdown: { _id: string; count: number }[];
}
