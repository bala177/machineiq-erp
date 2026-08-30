export enum Role {
  ADMIN = 'admin',
  MANAGER = 'manager',
  SALES = 'sales',
  DESIGNER = 'designer',
  LEADERSHIP = 'leadership',
}

export enum TaskStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  WAITING_FOR_INPUT = 'waiting_for_input',
  UNDER_REVIEW = 'under_review',
  BLOCKED = 'blocked',
  RELEASED = 'released',
  CLOSED = 'closed',
}

export enum OpportunityStatus {
  DRAFT = 'draft',
  NEW = 'new',
  UNDER_REVIEW = 'under_review',
  FEASIBILITY_IN_PROGRESS = 'feasibility_in_progress',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CONVERTED_TO_PROJECT = 'converted_to_project',
}

export enum OpportunityIntakeMode {
  BLANK = 'blank',
  TEMPLATE = 'template',
}

export enum QuoteStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  UNPAID = 'unpaid',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  OVERDUE = 'overdue',
  VOID = 'void',
}

export enum ProjectStage {
  INQUIRY = 'inquiry',
  FEASIBILITY = 'feasibility',
  CONCEPT_APPROVED = 'concept_approved',
  ENGINEERING_IN_PROGRESS = 'engineering_in_progress',
  REVIEW_RELEASE = 'review_release',
  PROCUREMENT_IN_PROGRESS = 'procurement_in_progress',
  BUILD_ASSEMBLY = 'build_assembly',
  FAT_SAT = 'fat_sat',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled',
}

export enum ProjectHealth {
  HEALTHY = 'healthy',
  WATCH = 'watch',
  AT_RISK = 'at_risk',
  DELAYED = 'delayed',
}

export enum ProcurementStatus {
  NOT_APPLICABLE = 'not_applicable',
  PENDING_DESIGN_RELEASE = 'pending_design_release',
  READY_FOR_PROCUREMENT = 'ready_for_procurement',
  ORDERED = 'ordered',
  PARTIALLY_RECEIVED = 'partially_received',
  RECEIVED = 'received',
  CHANGED_AFTER_RELEASE = 'changed_after_release',
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum TaskType {
  DESIGN = 'design',
  REVIEW = 'review',
  APPROVAL = 'approval',
  RELEASE = 'release',
  PROCUREMENT_HANDOVER = 'procurement_handover',
  FOLLOW_UP = 'follow_up',
}

export enum MachineNodeType {
  MACHINE = 'Machine',
  UNIT = 'Unit',
  EQUIPMENT_MODULE = 'EquipmentModule',
  CONTROL_MODULE = 'ControlModule',
  COMPONENT = 'Component',
}

export enum ModuleDepartment {
  MECHANICAL = 'Mechanical',
  ELECTRICAL = 'Electrical',
  AUTOMATION = 'Automation',
}

export enum ModuleCoordinationStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  COMPLETED = 'completed',
  READY_FOR_PROCUREMENT = 'ready_for_procurement',
}

export enum ComponentDiscipline {
  MECHANICAL = 'Mechanical',
  ELECTRICAL = 'Electrical',
  CONTROLS = 'Controls',
}

export enum ModuleComponentCategory {
  MECHANICAL = 'Mechanical',
  ELECTRICAL = 'Electrical',
  COTS = 'COTS',
  CUSTOM = 'Custom',
}

export enum ModuleComponentStatus {
  PLANNED = 'Planned',
  CONFIRMED = 'Confirmed',
  ORDERED = 'Ordered',
}

export enum ComponentDesignStatus {
  NOT_STARTED = 'NotStarted',
  IN_DESIGN = 'InDesign',
  UNDER_REVIEW = 'UnderReview',
  RELEASED = 'Released',
}

export enum ComponentProcurementStatus {
  NOT_READY = 'NotReady',
  READY = 'Ready',
  ORDERED = 'Ordered',
  RECEIVED = 'Received',
}

export enum ComponentAssemblyStatus {
  NOT_READY = 'NotReady',
  READY = 'Ready',
  INSTALLED = 'Installed',
}

export enum ComponentLifecycleStage {
  DESIGN = 'design',
  REVIEW = 'review',
  RELEASE = 'release',
  PROCUREMENT_READY = 'procurement_ready',
  ORDERED = 'ordered',
  RECEIVED = 'received',
  ASSEMBLY_READY = 'assembly_ready',
  BLOCKED = 'blocked',
}

export enum DependencyType {
  FINISH_TO_START = 'finish_to_start',
  START_TO_START = 'start_to_start',
  FINISH_TO_FINISH = 'finish_to_finish',
}

export enum NotificationType {
  ASSIGNMENT = 'assignment',
  DUE_REMINDER = 'due_reminder',
  OVERDUE = 'overdue',
  BLOCKER = 'blocker',
  ESCALATION = 'escalation',
  STATUS_CHANGE = 'status_change',
  COMMENT = 'comment',
  MILESTONE_RISK = 'milestone_risk',
}

export enum DiscussionEntryType {
  MEETING = 'meeting',
  CALL = 'call',
  EMAIL = 'email',
  NOTE = 'note',
  QUESTION = 'question',
  DECISION = 'decision',
}
