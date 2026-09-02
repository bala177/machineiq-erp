import { expect, Page } from '@playwright/test';
import {
  adminUser,
  components as seedComponents,
  customerA,
  customerB,
  dashboard,
  decisions,
  deliverables,
  documents,
  engineerUser,
  machineList,
  machineTrees,
  notifications as seedNotifications,
  opportunities as seedOpportunities,
  procurementDashboard,
  procurementItems as seedProcurementItems,
  projectComponentDashboard,
  projects as seedProjects,
  reviewerUser,
  tasks as seedTasks,
  users,
} from './mock-data';

type MockOptions = {
  loginFails?: boolean;
  forceUnauthorized?: boolean;
  needsSetup?: boolean;
  empty?: Partial<Record<'dashboard' | 'opportunities' | 'projects' | 'tasks' | 'machines' | 'procurement' | 'documents' | 'decisions' | 'notifications' | 'users' | 'components' | 'deliverables', boolean>>;
  formFailures?: Partial<Record<'opportunity' | 'project', string>>;
  detailNotFound?: Partial<Record<'opportunity' | 'project', boolean>>;
};

function jsonResponse(body: unknown, status = 200) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  };
}

export async function installApiMocks(page: Page, options: MockOptions = {}) {
  const mutableNotifications = seedNotifications.map((item) => ({ ...item }));
  const mutableOpportunities = seedOpportunities.map((item) => ({ ...item }));
  const mutableProjects = seedProjects.map((item) => ({ ...item }));
  const mutableTasks = seedTasks.map((item) => ({ ...item }));
  const procurementItems = seedProcurementItems.map((item) => ({ ...item }));
  const mutableComponents: any[] = seedComponents.map((item) => ({
    ...item,
    dependencyIds: item.dependencyIds.map((dependency) => ({ ...dependency })),
    deliverableIds: item.deliverableIds.map((deliverable) => ({ ...deliverable })),
  }));

  const buildComponentDashboard = (projectId: string) => {
    const filtered = mutableComponents.filter((component) => component.projectId === projectId);
    const machineBreakdown = machineList
      .map((machine) => {
        const machineComponents = filtered.filter((component) => {
          const machineRef = typeof component.machineId === 'string' ? component.machineId : component.machineId?._id;
          return machineRef === machine._id;
        });
        return {
          _id: machine._id,
          machineName: machine.name,
          totalComponents: machineComponents.length,
          completedComponents: machineComponents.filter((component) => component.assemblyStatus === 'Installed').length,
          pendingComponents: machineComponents.filter((component) => component.assemblyStatus !== 'Installed').length,
          delayedComponents: machineComponents.filter((component) => component.isDelayed).length,
          blockingProcurement: machineComponents.filter((component) => component.designStatus !== 'Released').length,
          blockingAssembly: machineComponents.filter((component) => component.procurementStatus !== 'Received').length,
        };
      })
      .filter((machine) => machine.totalComponents > 0);

    return {
      ...projectComponentDashboard,
      totalComponents: filtered.length,
      completedComponents: filtered.filter((component) => component.assemblyStatus === 'Installed').length,
      pendingComponents: filtered.filter((component) => component.assemblyStatus !== 'Installed').length,
      delayedComponents: filtered.filter((component) => component.isDelayed).length,
      componentsBlockingProcurement: filtered.filter((component) => component.designStatus !== 'Released').length,
      componentsBlockingAssembly: filtered.filter((component) => component.procurementStatus !== 'Received').length,
      totalModules: 2,
      modulesReadyForProcurement: 1,
      blockedModules: 1,
      longLeadRisks: filtered.filter((component) => component.longLeadRisk).length,
      machineBreakdown,
    };
  };

  const buildModuleSummaries = (projectId: string) => {
    const tree = machineTrees['machine-1'];
    const units = tree?.units || [];
    return units
      .map((unit: any) => {
        const moduleTasks = mutableTasks.filter((task: any) => task.projectId === projectId && task.moduleId === unit._id);
        const moduleComponents = mutableComponents.filter((component: any) => component.projectId === projectId && ((typeof component.moduleId === 'string' ? component.moduleId : component.moduleId?._id) === unit._id || (typeof component.unitId === 'string' ? component.unitId : component.unitId?._id) === unit._id));
        const deliverables = unit.deliverables || [];
        const completedDeliverables = deliverables.filter((item: any) => item.completed).length;
        const blockerCount = moduleTasks.filter((task: any) => task.status === 'blocked').length;
        const criticalBlockedTasks = moduleTasks.filter((task: any) => task.status === 'blocked' && task.priority === 'critical').length;
        const releaseEligible = deliverables.every((item: any) => item.completed) && criticalBlockedTasks === 0;
        return {
          ...unit,
          machineId: 'machine-1',
          machineName: 'Primary Cartoner',
          status: unit.status === 'ready_for_procurement' ? 'ready_for_procurement' : blockerCount > 0 ? 'blocked' : completedDeliverables > 0 || moduleTasks.length > 0 || moduleComponents.length > 0 ? 'in_progress' : 'not_started',
          blockerCount,
          criticalBlockedTasks,
          deliverableCount: deliverables.length,
          completedDeliverables,
          longLeadRiskCount: moduleComponents.filter((component: any) => component.longLeadRisk).length,
          releaseEligible,
          tasks: moduleTasks,
          components: moduleComponents,
        };
      })
      .filter((unit: any) => !options.empty?.machines || unit.projectId === projectId);
  };

  const syncComponentState = () => {
    const byId = new Map(mutableComponents.map((component) => [component._id, component]));
    mutableComponents.forEach((component) => {
      const dependencies = component.dependencyIds
        .map((dependency: any) => byId.get(dependency._id))
        .filter(Boolean);

      component.blockedByDependencies = dependencies.some((dependency: any) => dependency!.assemblyStatus !== 'Installed');
      component.blockerReason = component.blockedByDependencies
        ? `Blocked by dependency ${dependencies.find((dependency: any) => dependency!.assemblyStatus !== 'Installed')?.name}`
        : '';

      if (component.designStatus === 'Released' && component.procurementStatus === 'NotReady') component.procurementStatus = 'Ready';
      if (component.procurementStatus === 'Received' && component.assemblyStatus === 'NotReady') component.assemblyStatus = 'Ready';
      component.longLeadRisk = Number(component.leadTimeWeeks || 0) >= 8 && component.status !== 'Ordered';

      component.procurementVisible = component.designStatus === 'Released';
      component.procurementBlocked = component.designStatus !== 'Released';
      component.assemblyBlocked = component.procurementStatus !== 'Received';
      component.isDelayed = Boolean(component.dueDate && new Date(component.dueDate) < new Date() && component.designStatus !== 'Released');
    });
  };

  syncComponentState();

  await page.unroute('http://localhost:4051/api/**').catch(() => {});
  await page.route('http://localhost:4051/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api', '');
    const method = request.method();

    if (options.forceUnauthorized) {
      await route.fulfill(jsonResponse({ message: 'Unauthorized' }, 401));
      return;
    }

    if (path === '/auth/login' && method === 'POST') {
      if (options.loginFails) {
        await route.fulfill(jsonResponse({ message: 'Invalid credentials' }, 401));
        return;
      }
      await route.fulfill(jsonResponse({ access_token: 'token-admin', user: adminUser }));
      return;
    }

    if (path === '/auth/setup/status' && method === 'GET') {
      await route.fulfill(jsonResponse({ needsSetup: options.needsSetup ?? false }));
      return;
    }

    if (path === '/auth/setup' && method === 'POST') {
      await route.fulfill(jsonResponse({ access_token: 'token-admin', user: adminUser }));
      return;
    }

    if (path === '/organization/company' && method === 'GET') {
      await route.fulfill(jsonResponse({ _id: 'company-1', code: 'MIQ', name: 'MachineIQ', baseCurrency: 'INR', timezone: 'Asia/Kolkata' }));
      return;
    }

    if (path === '/organization/branches' && method === 'GET') {
      await route.fulfill(jsonResponse([{ _id: 'branch-1', code: 'HQ', name: 'Head Office', isActive: true }]));
      return;
    }

    if (path === '/organization/locations' && method === 'GET') {
      await route.fulfill(jsonResponse([{ _id: 'location-1', code: 'PLANT', name: 'Main Plant', type: 'factory', isActive: true }]));
      return;
    }

    if (path === '/suppliers' && method === 'GET') {
      await route.fulfill(jsonResponse([{ _id: 'supplier-1', code: 'SUP-0001', name: 'Motion Supply Co.' }]));
      return;
    }

    if (path === '/items' && method === 'GET') {
      await route.fulfill(jsonResponse([{ _id: 'item-1', code: 'ITM-0001', name: 'Servo Drive' }, { _id: 'item-2', code: 'ITM-0002', name: 'Safety Relay' }]));
      return;
    }

    if (path === '/items/categories' && method === 'GET') {
      await route.fulfill(jsonResponse([{ _id: 'category-1', code: 'ELEC', name: 'Electrical' }]));
      return;
    }

    if (path === '/items/uoms' && method === 'GET') {
      await route.fulfill(jsonResponse([{ _id: 'uom-1', code: 'EA', name: 'Each' }]));
      return;
    }

    if (path === '/document-types' && method === 'GET') {
      await route.fulfill(jsonResponse([{ _id: 'doctype-1', code: 'QUOTATION', name: 'Quotation' }]));
      return;
    }

    if (path === '/permissions/matrix' && method === 'GET') {
      await route.fulfill(jsonResponse({ permissions: [{ _id: 'permission-1', code: 'items.manage' }], assignments: [{ role: 'admin', permissionId: 'permission-1', allowed: true }] }));
      return;
    }

    if (path === '/dashboard/executive' && method === 'GET') {
      await route.fulfill(jsonResponse(options.empty?.dashboard ? { ...dashboard, departmentBottlenecks: [] } : dashboard));
      return;
    }

    if (path === '/dashboard/procurement' && method === 'GET') {
      await route.fulfill(jsonResponse(procurementDashboard));
      return;
    }

    if (path === '/dashboard/project-components' && method === 'GET') {
      const projectId = url.searchParams.get('projectId') || 'proj-1';
      await route.fulfill(jsonResponse(buildComponentDashboard(projectId)));
      return;
    }

    if (path === '/customers' && method === 'GET') {
      await route.fulfill(jsonResponse([customerA, customerB]));
      return;
    }

    if (path === '/users' && method === 'GET') {
      await route.fulfill(jsonResponse(options.empty?.users ? [] : users));
      return;
    }

    if (path.match(/^\/users\/[^/]+$/) && method === 'PATCH') {
      const body = await route.request().postDataJSON();
      await route.fulfill(jsonResponse({ ...adminUser, ...body, _id: path.split('/')[2] }));
      return;
    }

    if (path.match(/^\/users\/[^/]+$/) && method === 'DELETE') {
      await route.fulfill(jsonResponse({ message: 'User deleted' }));
      return;
    }

    if (path === '/departments' && method === 'GET') {
      await route.fulfill(jsonResponse([
        { _id: 'dept-1', name: 'Engineering' },
        { _id: 'dept-2', name: 'Procurement' },
        { _id: 'dept-3', name: 'Sales' },
      ]));
      return;
    }

    if (path === '/auth/register' && method === 'POST') {
      const body = await route.request().postDataJSON();
      const newUser = { _id: 'user-new', isActive: true, ...body };
      await route.fulfill(jsonResponse(newUser));
      return;
    }

    if (path === '/machine-templates' && method === 'GET') {
      await route.fulfill(jsonResponse([]));
      return;
    }

    if (path === '/opportunities/with-customer' && method === 'POST') {
      if (options.formFailures?.opportunity) {
        await route.fulfill(jsonResponse({ message: options.formFailures.opportunity }, 400));
        return;
      }
      const payload = request.postDataJSON() as Record<string, unknown>;
      const created = {
        _id: 'opp-created',
        title: (payload.title as string) || 'New Request',
        status: 'new',
        createdBy: adminUser,
        ...payload,
        customerId: [customerA, customerB].find((customer) => customer._id === payload.customerId) ?? customerA,
      };
      mutableOpportunities.unshift(created as never);
      await route.fulfill(jsonResponse(created, 201));
      return;
    }

    if (path === '/opportunities' && method === 'GET') {
      const status = url.searchParams.get('status');
      const limit = Number(url.searchParams.get('limit') || 5);
      const body = options.empty?.opportunities
        ? []
        : mutableOpportunities
          .filter((item) => !status || item.status === status)
          .filter((item) => item.customerId && item.createdBy)
          .slice(0, Number.isFinite(limit) ? limit : 5);
      await route.fulfill(jsonResponse({ data: body, total: body.length }));
      return;
    }

    if (path === '/opportunities' && method === 'POST') {
      if (options.formFailures?.opportunity) {
        await route.fulfill(jsonResponse({ message: options.formFailures.opportunity }, 400));
        return;
      }

      const payload = request.postDataJSON() as Record<string, unknown>;
      const created = {
        _id: 'opp-created',
        status: 'new',
        createdBy: adminUser,
        ...payload,
        customerId: [customerA, customerB].find((customer) => customer._id === payload.customerId) ?? customerA,
      };
      mutableOpportunities.unshift(created as never);
      await route.fulfill(jsonResponse(created, 201));
      return;
    }

    if (path.startsWith('/opportunities/') && path.endsWith('/review') && method === 'PATCH') {
      const id = path.split('/')[2];
      const match = mutableOpportunities.find((item) => item._id === id);
      if (!match) {
        await route.fulfill(jsonResponse({ message: 'Machine inquiry not found' }, 404));
        return;
      }
      const payload = request.postDataJSON() as Record<string, unknown>;
      Object.assign(match, payload);
      if (typeof payload.assignedReviewer === 'string') {
        match.assignedReviewer = users.find((user) => user._id === payload.assignedReviewer) ?? reviewerUser;
      }
      await route.fulfill(jsonResponse(match));
      return;
    }

    if (path.startsWith('/opportunities/') && path.endsWith('/status') && method === 'PATCH') {
      const id = path.split('/')[2];
      const match = mutableOpportunities.find((item) => item._id === id);
      if (!match) {
        await route.fulfill(jsonResponse({ message: 'Machine inquiry not found' }, 404));
        return;
      }
      const payload = request.postDataJSON() as { status?: string };
      match.status = payload.status || match.status;
      await route.fulfill(jsonResponse(match));
      return;
    }

    if (path.startsWith('/opportunities/') && path.endsWith('/discussion') && method === 'GET') {
      await route.fulfill(jsonResponse([]));
      return;
    }

    if (path.match(/^\/opportunities\/[^/]+\/convert$/) && method === 'POST') {
      const payload = request.postDataJSON() as Record<string, unknown>;
      const project = {
        _id: 'proj-created', milestones: [], teamMembers: [], kickoff: {}, ...payload,
        customerId: [customerA, customerB].find((customer) => customer._id === payload.customerId) ?? customerA,
        projectManagerId: users.find((user) => user._id === payload.projectManagerId) ?? adminUser,
      };
      mutableProjects.unshift(project as never);
      await route.fulfill(jsonResponse({ project }, 201));
      return;
    }

    if (path.startsWith('/opportunities/') && method === 'GET') {
      const id = path.split('/')[2];
      if (options.detailNotFound?.opportunity) {
        await route.fulfill(jsonResponse({ message: 'Machine inquiry not found' }, 404));
        return;
      }
      const opportunity = mutableOpportunities.find((item) => item._id === id);
      await route.fulfill(jsonResponse(opportunity ?? { message: 'Machine inquiry not found' }, opportunity ? 200 : 404));
      return;
    }

    if (path === '/projects' && method === 'GET') {
      const stage = url.searchParams.get('stage');
      const body = options.empty?.projects ? [] : mutableProjects.filter((item) => !stage || item.stage === stage);
      await route.fulfill(jsonResponse(body));
      return;
    }

    if (path === '/projects' && method === 'POST') {
      if (options.formFailures?.project) {
        await route.fulfill(jsonResponse({ message: options.formFailures.project }, 400));
        return;
      }

      const payload = request.postDataJSON() as Record<string, unknown>;
      const created = {
        _id: 'proj-created',
        milestones: [],
        teamMembers: [],
        kickoff: {},
        ...payload,
        customerId: [customerA, customerB].find((customer) => customer._id === payload.customerId) ?? customerA,
        projectManagerId: users.find((user) => user._id === payload.projectManagerId) ?? adminUser,
      };
      mutableProjects.unshift(created as never);
      await route.fulfill(jsonResponse(created, 201));
      return;
    }

    if (path.startsWith('/projects/') && method === 'GET') {
      const id = path.split('/')[2];
      if (options.detailNotFound?.project) {
        await route.fulfill(jsonResponse({ message: 'Project not found' }, 404));
        return;
      }
      const project = mutableProjects.find((item) => item._id === id);
      await route.fulfill(jsonResponse(project ?? { message: 'Project not found' }, project ? 200 : 404));
      return;
    }

    if (path === '/tasks' && method === 'GET') {
      const projectId = url.searchParams.get('projectId');
      const status = url.searchParams.get('status');
      const body = options.empty?.tasks
        ? []
        : mutableTasks.filter((item) => (!projectId || item.projectId === projectId) && (!status || item.status === status));
      await route.fulfill(jsonResponse(body));
      return;
    }

    if (path.startsWith('/tasks/') && method === 'PATCH') {
      const id = path.split('/')[2];
      const match = mutableTasks.find((task) => task._id === id);
      if (!match) {
        await route.fulfill(jsonResponse({ message: 'Task not found' }, 404));
        return;
      }
      const payload = request.postDataJSON() as Record<string, any>;
      Object.assign(match, payload);

      if (payload.dependsOnTaskId !== undefined) {
        const dependency = mutableTasks.find((task) => task._id === payload.dependsOnTaskId);
        match.dependsOnTaskId = dependency ? { _id: dependency._id, title: dependency.title, status: dependency.status } : null;
        if (dependency && !['released', 'closed'].includes(dependency.status)) {
          match.status = 'blocked';
          match.dependencyBlocked = true;
          match.blockerReason = `Waiting on ${dependency.title}`;
        } else {
          match.dependencyBlocked = false;
          if (match.blockerReason?.startsWith('Waiting on ')) match.blockerReason = '';
          if (match.status === 'blocked') match.status = 'not_started';
        }
      }

      await route.fulfill(jsonResponse(match));
      return;
    }

    if (path === '/components' && method === 'GET') {
      const projectId = url.searchParams.get('projectId');
      const machineId = url.searchParams.get('machineId');
      const body = options.empty?.components ? [] : mutableComponents.filter((item) => (!projectId || item.projectId === projectId) && (!machineId || (typeof item.machineId === 'string' ? item.machineId : item.machineId?._id) === machineId));
      await route.fulfill(jsonResponse(body));
      return;
    }

    if (path === '/components' && method === 'POST') {
      const payload = request.postDataJSON() as Record<string, any>;
      const owner = users.find((user) => user._id === payload.ownerId) ?? engineerUser;
      const machine = machineList.find((item) => item._id === payload.machineId) ?? machineList[0];
      const tree = machineTrees[machine._id];
      const units = tree?.units || [];
      const equipmentModules = units.flatMap((unit: any) => unit.equipmentModules || []);
      const controlModules = equipmentModules.flatMap((equipmentModule: any) => equipmentModule.controlModules || []);
      const parentType = payload.parentType || 'Machine';
      const parentId = payload.parentId || machine._id;
      const unit = parentType === 'Unit'
        ? units.find((item: any) => item._id === parentId) ?? null
        : parentType === 'EquipmentModule'
          ? units.find((entry: any) => (entry.equipmentModules || []).some((item: any) => item._id === parentId)) ?? null
          : parentType === 'ControlModule'
            ? units.find((entry: any) => (entry.equipmentModules || []).some((equipmentModule: any) => (equipmentModule.controlModules || []).some((item: any) => item._id === parentId))) ?? null
            : null;
      const equipmentModule = parentType === 'EquipmentModule'
        ? equipmentModules.find((item: any) => item._id === parentId) ?? null
        : parentType === 'ControlModule'
          ? equipmentModules.find((entry: any) => (entry.controlModules || []).some((item: any) => item._id === parentId)) ?? null
          : null;
      const controlModule = parentType === 'ControlModule' ? controlModules.find((item: any) => item._id === parentId) ?? null : null;

      const created = {
        _id: `comp-${mutableComponents.length + 1}`,
        name: payload.name,
        partName: payload.partName || payload.name,
        code: payload.code || undefined,
        projectId: payload.projectId,
        machineId: { _id: machine._id, name: machine.name },
        moduleId: unit ? { _id: unit._id, name: unit.name } : null,
        unitId: unit ? { _id: unit._id, name: unit.name } : null,
        equipmentModuleId: equipmentModule ? { _id: equipmentModule._id, name: equipmentModule.name } : null,
        controlModuleId: controlModule ? { _id: controlModule._id, name: controlModule.name } : null,
        ownerId: owner,
        dueDate: payload.dueDate || null,
        discipline: payload.discipline || undefined,
        quantity: payload.quantity || 1,
        category: payload.category || 'Mechanical',
        supplier: payload.supplier || '',
        leadTimeWeeks: payload.leadTimeWeeks || 0,
        status: payload.status || 'Planned',
        remarks: payload.remarks || '',
        designStatus: 'NotStarted',
        procurementStatus: 'NotReady',
        assemblyStatus: 'NotReady',
        lifecycleStage: 'design',
        parentType,
        parentId,
        dependencyIds: mutableComponents
          .filter((component) => (payload.dependencyIds || []).includes(component._id))
          .map((component) => ({ _id: component._id, name: component.name, lifecycleStage: component.lifecycleStage })),
        deliverableIds: deliverables
          .filter((deliverable) => (payload.deliverableIds || []).includes(deliverable._id))
          .map((deliverable) => ({ _id: deliverable._id, title: deliverable.title, projectId: deliverable.projectId })),
        blockedByDependencies: false,
        blockerReason: '',
        procurementVisible: false,
        procurementBlocked: true,
        assemblyBlocked: true,
        isDelayed: false,
      };

      mutableComponents.push(created as any);
      syncComponentState();
      await route.fulfill(jsonResponse(created, 201));
      return;
    }

    if (path.startsWith('/components/projects/') && path.endsWith('/sync') && method === 'POST') {
      syncComponentState();
      await route.fulfill(jsonResponse({ success: true }));
      return;
    }

    if (path.startsWith('/components/projects/') && path.endsWith('/process-reminders') && method === 'POST') {
      const projectId = path.split('/')[3];
      const overdueCount = mutableComponents.filter(
        (component) => component.projectId === projectId && component.dueDate && component.designStatus !== 'Released' && new Date(component.dueDate) < new Date(),
      ).length;
      await route.fulfill(jsonResponse({ success: true, overdueCount }));
      return;
    }

    if (path.startsWith('/components/') && method === 'PATCH') {
      const id = path.split('/')[2];
      const match = mutableComponents.find((component) => component._id === id);
      if (!match) {
        await route.fulfill(jsonResponse({ message: 'Component not found' }, 404));
        return;
      }

      const payload = request.postDataJSON() as Record<string, any>;
      if (payload.designStatus) match.designStatus = payload.designStatus;
      if (payload.procurementStatus) match.procurementStatus = payload.procurementStatus;
      if (payload.assemblyStatus) match.assemblyStatus = payload.assemblyStatus;
      if (payload.partName !== undefined) match.partName = payload.partName;
      if (payload.name !== undefined) match.name = payload.name;
      if (payload.quantity !== undefined) match.quantity = payload.quantity;
      if (payload.category !== undefined) match.category = payload.category;
      if (payload.supplier !== undefined) match.supplier = payload.supplier;
      if (payload.leadTimeWeeks !== undefined) match.leadTimeWeeks = payload.leadTimeWeeks;
      if (payload.status !== undefined) match.status = payload.status;
      if (payload.remarks !== undefined) match.remarks = payload.remarks;

      syncComponentState();
      await route.fulfill(jsonResponse(match));
      return;
    }

    if (path.startsWith('/components/') && method === 'DELETE') {
      const id = path.split('/')[2];
      const index = mutableComponents.findIndex((component) => component._id === id);
      if (index >= 0) mutableComponents.splice(index, 1);
      await route.fulfill(jsonResponse({ message: 'Component deleted' }));
      return;
    }

    if (path === '/meta/machine-architecture-enums' && method === 'GET') {
      await route.fulfill(jsonResponse({
        nodeTypes: ['Machine', 'Unit', 'EquipmentModule', 'ControlModule', 'Component'],
        disciplines: ['Mechanical', 'Electrical', 'Controls'],
        designStatuses: ['NotStarted', 'InDesign', 'UnderReview', 'Released'],
        procurementStatuses: ['NotReady', 'Ready', 'Ordered', 'Received'],
        assemblyStatuses: ['NotReady', 'Ready', 'Installed'],
        moduleDepartments: ['Mechanical', 'Electrical', 'Automation'],
        moduleStatuses: ['not_started', 'in_progress', 'blocked', 'completed', 'ready_for_procurement'],
        moduleComponentCategories: ['Mechanical', 'Electrical', 'COTS', 'Custom'],
        moduleComponentStatuses: ['Planned', 'Confirmed', 'Ordered'],
        taskStatuses: ['not_started', 'in_progress', 'waiting_for_input', 'under_review', 'blocked', 'released', 'closed'],
        priorities: ['low', 'medium', 'high', 'critical'],
      }));
      return;
    }

    if (path.match(/^\/machines\/projects\/[^/]+\/modules$/) && method === 'GET') {
      const projectId = path.split('/')[3];
      await route.fulfill(jsonResponse(buildModuleSummaries(projectId)));
      return;
    }

    if (path === '/machines' && method === 'GET') {
      const projectId = url.searchParams.get('projectId');
      const body = options.empty?.machines ? [] : machineList.filter((machine) => !projectId || machine.projectId?._id === projectId);
      await route.fulfill(jsonResponse(body));
      return;
    }

    if (path === '/machines' && method === 'POST') {
      const payload = request.postDataJSON() as Record<string, any>;
      const created = {
        _id: `machine-${machineList.length + 1}`,
        name: payload.name,
        projectId: seedProjects.find((project: any) => project._id === payload.projectId) ? { _id: payload.projectId, name: seedProjects.find((project: any) => project._id === payload.projectId)!.name } : undefined,
        unitCount: 0,
        componentCount: 0,
        delayedCount: 0,
        designProgress: 0,
        procurementProgress: 0,
        assemblyProgress: 0,
      };
      machineList.push(created as any);
      machineTrees[created._id] = { _id: created._id, name: created.name, projectId: created.projectId, units: [], components: [] };
      await route.fulfill(jsonResponse(created, 201));
      return;
    }

    if (path.match(/^\/machines\/[^/]+\/tree$/) && method === 'GET') {
      const id = path.split('/')[2];
      const tree = machineTrees[id];
      await route.fulfill(jsonResponse(tree ?? { message: 'Machine not found' }, tree ? 200 : 404));
      return;
    }

    if (path.match(/^\/machines\/units\/[^/]+\/release-to-procurement$/) && method === 'POST') {
      const unitId = path.split('/')[3];
      const tree = machineTrees['machine-1'];
      const unit = tree.units.find((item: any) => item._id === unitId);
      if (!unit) {
        await route.fulfill(jsonResponse({ message: 'Unit not found' }, 404));
        return;
      }
      unit.status = 'ready_for_procurement';
      unit.releaseReady = true;
      unit.componentsLocked = true;
      mutableComponents
        .filter((component) => (typeof component.moduleId === 'string' ? component.moduleId : component.moduleId?._id) === unitId)
        .forEach((component) => {
          component.designStatus = 'Released';
          if (component.procurementStatus === 'NotReady') component.procurementStatus = component.status === 'Ordered' ? 'Ordered' : 'Ready';
        });
      syncComponentState();
      await route.fulfill(jsonResponse({ success: true }));
      return;
    }

    if (path.match(/^\/machines\/units\/[^/]+$/) && method === 'PATCH') {
      const unitId = path.split('/')[3];
      const tree = machineTrees['machine-1'];
      const unit = tree.units.find((item: any) => item._id === unitId);
      if (!unit) {
        await route.fulfill(jsonResponse({ message: 'Unit not found' }, 404));
        return;
      }
      const payload = request.postDataJSON() as Record<string, any>;
      Object.assign(unit, payload);
      await route.fulfill(jsonResponse(unit));
      return;
    }

    if (path.match(/^\/machines\/[^/]+\/stats$/) && method === 'GET') {
      const id = path.split('/')[2];
      const machineComponents = mutableComponents.filter((component) => (typeof component.machineId === 'string' ? component.machineId : component.machineId?._id) === id);
      const tree = machineTrees[id];
      const units = tree?.units || [];
      const equipmentModules = units.flatMap((unit: any) => unit.equipmentModules || []);
      const controlModules = equipmentModules.flatMap((equipmentModule: any) => equipmentModule.controlModules || []);
      await route.fulfill(jsonResponse({
        units: units.length,
        equipmentModules: equipmentModules.length,
        controlModules: controlModules.length,
        components: machineComponents.length,
        delayed: machineComponents.filter((component) => component.isDelayed).length,
        designProgress: machineComponents.length ? Math.round((machineComponents.filter((component) => component.designStatus === 'Released').length / machineComponents.length) * 100) : 0,
        procurementProgress: machineComponents.length ? Math.round((machineComponents.filter((component) => component.procurementStatus === 'Received').length / machineComponents.length) * 100) : 0,
        assemblyProgress: machineComponents.length ? Math.round((machineComponents.filter((component) => component.assemblyStatus === 'Installed').length / machineComponents.length) * 100) : 0,
      }));
      return;
    }

    if (path === '/procurement/items' && method === 'GET') {
      const status = url.searchParams.get('status');
      const body = options.empty?.procurement ? [] : procurementItems.filter((item) => !status || item.status === status);
      await route.fulfill(jsonResponse(body));
      return;
    }

    if (path === '/deliverables' && method === 'GET') {
      const projectId = url.searchParams.get('projectId');
      const body = options.empty?.deliverables ? [] : deliverables.filter((item) => !projectId || item.projectId === projectId);
      await route.fulfill(jsonResponse(body));
      return;
    }

    if (path === '/documents' && method === 'GET') {
      await route.fulfill(jsonResponse(options.empty?.documents ? [] : documents));
      return;
    }

    if (path === '/documents/decisions' && method === 'GET') {
      await route.fulfill(jsonResponse(options.empty?.decisions ? [] : decisions));
      return;
    }

    if (path === '/notifications' && method === 'GET') {
      await route.fulfill(jsonResponse(options.empty?.notifications ? [] : mutableNotifications));
      return;
    }

    if (path === '/notifications/read-all' && method === 'PATCH') {
      mutableNotifications.forEach((item) => {
        item.read = true;
      });
      await route.fulfill(jsonResponse({ success: true }));
      return;
    }

    if (path.startsWith('/notifications/') && path.endsWith('/read') && method === 'PATCH') {
      const id = path.split('/')[2];
      const match = mutableNotifications.find((item) => item._id === id);
      if (match) {
        match.read = true;
      }
      await route.fulfill(jsonResponse({ success: true }));
      return;
    }

    await route.fulfill(jsonResponse({ message: `Unhandled route: ${method} ${path}` }, 500));
  });
}

export async function setAuthenticatedSession(page: Page, role: 'admin' | 'manager' | 'sales' | 'designer' | 'leadership' = 'admin') {
  const sessionUsers = {
    admin: adminUser,
    manager: reviewerUser,
    sales: { ...adminUser, id: 'user-sales', _id: 'user-sales', email: 'sales@machineiq.com', firstName: 'Sam', lastName: 'Sales', role: 'sales' },
    designer: engineerUser,
    leadership: { ...adminUser, id: 'user-leadership', _id: 'user-leadership', email: 'leader@machineiq.com', firstName: 'Lena', lastName: 'Leader', role: 'leadership' },
  };
  const user = sessionUsers[role] ?? adminUser;

  await page.addInitScript((sessionUser) => {
    localStorage.setItem('machineiq_token', 'seed-token');
    localStorage.setItem('machineiq_user', JSON.stringify(sessionUser));
  }, user);
}

export async function loginThroughUi(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@machineiq.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
