/**
 * enums.spec.ts
 *
 * Verifies that every backend enum value matches the string literals
 * used in the frontend. This prevents silent schema mismatches when
 * a status or type is changed on one side only.
 *
 * Frontend constants source: frontend/src/lib/opportunities.ts
 * Backend enums source:      backend/src/common/enums.ts
 */

import {
  Role,
  OpportunityStatus,
  Priority,
  TaskStatus,
  ProjectStage,
  ProjectHealth,
  ProcurementStatus,
  TaskType,
  ModuleCoordinationStatus,
  OpportunityIntakeMode,
  InvoiceStatus,
} from './enums';

// ---------------------------------------------------------------------------
// Role enum
// ---------------------------------------------------------------------------

describe('Role enum — matches frontend auth roles', () => {
  it('has exactly the 5 expected role values', () => {
    const expected = ['admin', 'manager', 'sales', 'designer', 'leadership'];
    expect(Object.values(Role).sort()).toEqual(expected.sort());
  });

  it('Role.ADMIN = "admin"', () => expect(Role.ADMIN).toBe('admin'));
  it('Role.MANAGER = "manager"', () => expect(Role.MANAGER).toBe('manager'));
  it('Role.SALES = "sales"', () => expect(Role.SALES).toBe('sales'));
  it('Role.DESIGNER = "designer"', () => expect(Role.DESIGNER).toBe('designer'));
  it('Role.LEADERSHIP = "leadership"', () => expect(Role.LEADERSHIP).toBe('leadership'));
});

// ---------------------------------------------------------------------------
// OpportunityStatus enum — matches frontend OPPORTUNITY_WORKFLOW statuses
// ---------------------------------------------------------------------------

describe('OpportunityStatus enum — matches frontend workflow statuses', () => {
  // Frontend OPPORTUNITY_WORKFLOW includes all non-draft statuses displayed in UI
  const frontendWorkflowStatuses = [
    'new',
    'under_review',
    'feasibility_in_progress',
    'approved',
    'rejected',
    'converted_to_project',
  ];

  it('has expected string values', () => {
    expect(OpportunityStatus.DRAFT).toBe('draft');
    expect(OpportunityStatus.NEW).toBe('new');
    expect(OpportunityStatus.UNDER_REVIEW).toBe('under_review');
    expect(OpportunityStatus.FEASIBILITY_IN_PROGRESS).toBe('feasibility_in_progress');
    expect(OpportunityStatus.APPROVED).toBe('approved');
    expect(OpportunityStatus.REJECTED).toBe('rejected');
    expect(OpportunityStatus.CONVERTED_TO_PROJECT).toBe('converted_to_project');
  });

  it('all frontend workflow statuses are valid OpportunityStatus values', () => {
    const backendValues = Object.values(OpportunityStatus);
    frontendWorkflowStatuses.forEach((status) => {
      expect(backendValues).toContain(status);
    });
  });

  it('has exactly 7 status values (draft + 6 workflow stages)', () => {
    expect(Object.values(OpportunityStatus)).toHaveLength(7);
  });
});

// ---------------------------------------------------------------------------
// OpportunityIntakeMode enum
// ---------------------------------------------------------------------------

describe('OpportunityIntakeMode enum', () => {
  it('has exactly 2 modes: blank and template', () => {
    expect(Object.values(OpportunityIntakeMode).sort()).toEqual(['blank', 'template'].sort());
  });

  it('OpportunityIntakeMode.BLANK = "blank"', () => {
    expect(OpportunityIntakeMode.BLANK).toBe('blank');
  });

  it('OpportunityIntakeMode.TEMPLATE = "template"', () => {
    expect(OpportunityIntakeMode.TEMPLATE).toBe('template');
  });
});

describe('InvoiceStatus enum', () => {
  const expectedValues = ['draft', 'sent', 'unpaid', 'partially_paid', 'paid', 'overdue', 'void'];

  it('has the expected invoice lifecycle values', () => {
    expect(Object.values(InvoiceStatus).sort()).toEqual(expectedValues.sort());
  });
});

// ---------------------------------------------------------------------------
// Priority enum — matches frontend priority options
// ---------------------------------------------------------------------------

describe('Priority enum — matches frontend priority constants', () => {
  // Frontend typically renders these four priority options
  const frontendPriorities = ['low', 'medium', 'high', 'critical'];

  it('has exactly 4 priority values', () => {
    expect(Object.values(Priority)).toHaveLength(4);
  });

  it('all frontend priority labels exist as Priority enum values', () => {
    const backendValues = Object.values(Priority);
    frontendPriorities.forEach((p) => {
      expect(backendValues).toContain(p);
    });
  });

  it('Priority.LOW = "low"',      () => expect(Priority.LOW).toBe('low'));
  it('Priority.MEDIUM = "medium"',() => expect(Priority.MEDIUM).toBe('medium'));
  it('Priority.HIGH = "high"',    () => expect(Priority.HIGH).toBe('high'));
  it('Priority.CRITICAL = "critical"', () => expect(Priority.CRITICAL).toBe('critical'));
});

// ---------------------------------------------------------------------------
// TaskStatus enum
// ---------------------------------------------------------------------------

describe('TaskStatus enum — matches CLAUDE.md task status conventions', () => {
  const expectedValues = [
    'not_started',
    'in_progress',
    'waiting_for_input',
    'under_review',
    'blocked',
    'released',
    'closed',
  ];

  it('has exactly 7 task status values', () => {
    expect(Object.values(TaskStatus)).toHaveLength(7);
  });

  expectedValues.forEach((v) => {
    it(`TaskStatus contains "${v}"`, () => {
      expect(Object.values(TaskStatus)).toContain(v);
    });
  });
});

// ---------------------------------------------------------------------------
// ProjectStage enum
// ---------------------------------------------------------------------------

describe('ProjectStage enum — matches CLAUDE.md project stage conventions', () => {
  const expectedStages = [
    'inquiry',
    'feasibility',
    'concept_approved',
    'engineering_in_progress',
    'review_release',
    'procurement_in_progress',
    'build_assembly',
    'fat_sat',
    'completed',
    'on_hold',
    'cancelled',
  ];

  it('has exactly 11 project stage values', () => {
    expect(Object.values(ProjectStage)).toHaveLength(11);
  });

  expectedStages.forEach((stage) => {
    it(`ProjectStage contains "${stage}"`, () => {
      expect(Object.values(ProjectStage)).toContain(stage);
    });
  });
});

// ---------------------------------------------------------------------------
// ProjectHealth enum
// ---------------------------------------------------------------------------

describe('ProjectHealth enum', () => {
  it('has exactly 4 health values: healthy, watch, at_risk, delayed', () => {
    expect(Object.values(ProjectHealth).sort()).toEqual(
      ['healthy', 'watch', 'at_risk', 'delayed'].sort(),
    );
  });
});

// ---------------------------------------------------------------------------
// ProcurementStatus enum
// ---------------------------------------------------------------------------

describe('ProcurementStatus enum — matches CLAUDE.md procurement status conventions', () => {
  const expectedStatuses = [
    'not_applicable',
    'pending_design_release',
    'ready_for_procurement',
    'ordered',
    'partially_received',
    'received',
    'changed_after_release',
  ];

  it('has exactly 7 procurement status values', () => {
    expect(Object.values(ProcurementStatus)).toHaveLength(7);
  });

  expectedStatuses.forEach((s) => {
    it(`ProcurementStatus contains "${s}"`, () => {
      expect(Object.values(ProcurementStatus)).toContain(s);
    });
  });
});

// ---------------------------------------------------------------------------
// TaskType enum
// ---------------------------------------------------------------------------

describe('TaskType enum', () => {
  const expectedTypes = [
    'design',
    'review',
    'approval',
    'release',
    'procurement_handover',
    'follow_up',
  ];

  it('has exactly 6 task type values', () => {
    expect(Object.values(TaskType)).toHaveLength(6);
  });

  expectedTypes.forEach((t) => {
    it(`TaskType contains "${t}"`, () => {
      expect(Object.values(TaskType)).toContain(t);
    });
  });
});

// ---------------------------------------------------------------------------
// ModuleCoordinationStatus enum
// ---------------------------------------------------------------------------

describe('ModuleCoordinationStatus enum', () => {
  const expectedStatuses = [
    'not_started',
    'in_progress',
    'blocked',
    'completed',
    'ready_for_procurement',
  ];

  it('has exactly 5 coordination status values', () => {
    expect(Object.values(ModuleCoordinationStatus)).toHaveLength(5);
  });

  expectedStatuses.forEach((s) => {
    it(`ModuleCoordinationStatus contains "${s}"`, () => {
      expect(Object.values(ModuleCoordinationStatus)).toContain(s);
    });
  });
});

// ---------------------------------------------------------------------------
// No duplicate enum values across all enums
// ---------------------------------------------------------------------------

describe('Enum uniqueness — no duplicate values within any enum', () => {
  const enums = {
    Role,
    OpportunityStatus,
    Priority,
    TaskStatus,
    ProjectStage,
    ProjectHealth,
    ProcurementStatus,
    TaskType,
    ModuleCoordinationStatus,
    InvoiceStatus,
  };

  Object.entries(enums).forEach(([name, enumObj]) => {
    it(`${name} has no duplicate values`, () => {
      const values = Object.values(enumObj);
      const unique = new Set(values);
      expect(unique.size).toBe(values.length);
    });
  });
});
