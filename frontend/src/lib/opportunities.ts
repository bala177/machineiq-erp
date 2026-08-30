export type ExistingMachineCheck = { item: string; checked: boolean; note: string };

export type OpportunityIntakeFormValues = {
  // Identity
  title: string;
  customerId: string;
  machineCondition: 'new' | 'existing';
  existingMachineChecks: ExistingMachineCheck[];

  // Tab 1 — Machine Purpose
  machinePurpose: string;
  machineCategory: string;   // handling | processing | assembly | testing | inspection | custom
  buildType: string;         // new | retrofit | upgrade | clone

  // Work Object
  objectType: string;
  sizeRange: string;
  weightRange: string;
  variability: string;       // single | multiple | unknown

  // Process Definition
  primaryOperation: string;
  processType: string;       // continuous | discrete | batch | unknown
  processSummary: string;    // detailed notes (kept for backward compat)

  // Layout & Space
  machineLayout: string;     // Inline | Rotary | Gantry | Cell | Custom
  availableSpace: string;
  accessRequirement: string; // operator | maintenance | both | unknown

  // Machine Structure
  estimatedModules: string;  // comma-separated
  complexityLevel: string;   // low | medium | high

  // Automation
  automationLevel: string;   // manual | semi_auto | fully_auto
  humanInteraction: string;  // high | medium | low

  // Component context
  componentMaterial: string; // al_casting | cast_iron | plastic | rubber | steel | other
  targetIndustry: string;    // automotive | foundry | plastic_rubber | general_eng | other

  // Macpro SPM intake fields
  machineVertical: string;       // foundry | machine_shop | spm | fabrication
  quantity: string;              // '1' | '2' | '3_5' | '5_plus'
  inquirySource: string;         // rfq | email | site_visit | phone | reference | repeat
  criticalSpec: string;
  siteVisitStatus: string;       // yes | no | planned
  customerDrawingStatus: string; // yes | no | pending

  // Tab 2 — Performance
  targetOutput: string;
  operationMode: string;     // continuous | cycle_based | unknown
  deliveryTargetDate: string;
  priority: string;          // low | medium | high | critical

  // Quality
  accuracyRequirement: string;
  repeatabilityNeeded: string; // yes | no
  qualityCheckNeeded: string;  // yes | no

  // Operating Conditions
  environment: string;       // normal | dust | wet | clean | custom
  environmentNotes: string;
  operatingHoursPerDay: string;
  dutyCycle: string;         // light | medium | heavy

  // Utilities
  powerAvailable: string;
  airAvailable: string;      // yes | no | unknown
  otherUtilities: string;

  // Tab 3 — Constraints
  budgetRange: string;       // lt_50k | 50k_100k | 100k_250k | 250k_plus | unknown

  // Requirements & Standards
  standardsCompliance: string; // comma-separated
  preferredTechnology: string;
  integrationRequired: string; // yes | no
  integrationNotes: string;

  // Engineering Context
  newConcept: string;          // yes | no
  unclearAreas: string;
  dependency: string;

  // Stakeholders
  customerContact: string;
  internalOwner: string;

  // Tab 4 — Checklist (template-driven)
  checklistResponses: Array<{ label: string; response: string }>;
};

export type OpportunityIntakeFieldErrors = Partial<Record<keyof OpportunityIntakeFormValues, string>>;

export const OPPORTUNITY_WORKFLOW = [
  {
    status: 'draft',
    title: 'Draft',
    description: 'Customer and machine intake is being captured before the request enters the active pipeline.',
  },
  {
    status: 'new',
    title: 'New',
    description: 'Submitted request waiting for PM/admin triage and reviewer assignment.',
  },
  {
    status: 'under_review',
    title: 'Under Review',
    description: 'A reviewer is assigned and the request is queued for technical review.',
  },
  {
    status: 'feasibility_in_progress',
    title: 'Feasibility In Progress',
    description: 'The assigned reviewer or PM works through feasibility, complexity, and risk.',
  },
  {
    status: 'approved',
    title: 'Approved',
    description: 'The request is ready for project conversion.',
  },
  {
    status: 'rejected',
    title: 'Rejected',
    description: 'The request stops here unless a PM or admin reopens review.',
  },
  {
    status: 'converted_to_project',
    title: 'Converted To Project',
    description: 'The opportunity remains linked to the project created from it.',
  },
] as const;

export const OPPORTUNITY_STAGE_TRACK = [
  'draft',
  'new',
  'under_review',
  'feasibility_in_progress',
  'approved',
  'converted_to_project',
] as const;

// ── Normalise legacy values ──────────────────────────────────────────────────

function normalizeBudgetRange(raw: string | undefined): string {
  if (!raw) return '';
  const map: Record<string, string> = {
    '<50K':      'lt_5L',
    '50–100K':   '5_10L',
    '100–250K':  '10_25L',
    '250K+':     '50L_plus',
    'lt_50k':    'lt_5L',
    '50k_100k':  '5_10L',
    '100k_250k': '10_25L',
    '250k_plus': '50L_plus',
    'unknown':   'open',
  };
  return map[raw] ?? raw;
}

function normalizeAutomationLevel(raw: string | undefined): string {
  if (!raw) return '';
  const map: Record<string, string> = {
    'Semi':      'semi_auto',
    'Auto':      'fully_auto',
    'Full Auto': 'fully_auto',
  };
  return map[raw] ?? raw;
}

// ── createEmpty ──────────────────────────────────────────────────────────────

export function createEmptyOpportunityIntakeForm(): OpportunityIntakeFormValues {
  return {
    title: '',
    customerId: '',
    machineCondition: 'new',
    existingMachineChecks: [],
    machinePurpose: '',
    machineCategory: '',
    buildType: 'new',
    objectType: '',
    sizeRange: '',
    weightRange: '',
    variability: '',
    primaryOperation: '',
    processType: '',
    processSummary: '',
    machineLayout: '',
    availableSpace: '',
    accessRequirement: '',
    estimatedModules: '',
    complexityLevel: '',
    automationLevel: '',
    humanInteraction: '',
    componentMaterial: '',
    targetIndustry: '',
    machineVertical: '',
    quantity: '',
    inquirySource: '',
    criticalSpec: '',
    siteVisitStatus: '',
    customerDrawingStatus: '',
    targetOutput: '',
    operationMode: '',
    deliveryTargetDate: '',
    priority: 'medium',
    accuracyRequirement: '',
    repeatabilityNeeded: '',
    qualityCheckNeeded: '',
    environment: '',
    environmentNotes: '',
    operatingHoursPerDay: '',
    dutyCycle: '',
    powerAvailable: '',
    airAvailable: '',
    otherUtilities: '',
    budgetRange: '',
    standardsCompliance: '',
    preferredTechnology: '',
    integrationRequired: '',
    integrationNotes: '',
    newConcept: '',
    unclearAreas: '',
    dependency: '',
    customerContact: '',
    internalOwner: '',
    checklistResponses: [],
  };
}

// ── map API → form ───────────────────────────────────────────────────────────

export function mapOpportunityToIntakeForm(opportunity: any): OpportunityIntakeFormValues {
  const boolToYesNo = (v: unknown) =>
    v === true ? 'yes' : v === false ? 'no' : '';

  const arrToStr = (v: unknown) =>
    Array.isArray(v) ? v.join(', ') : typeof v === 'string' ? v : '';

  return {
    title: opportunity?.title || '',
    customerId: opportunity?.customerId?._id || opportunity?.customerId || '',
    machineCondition: opportunity?.machineCondition === 'existing' ? 'existing' : 'new',
    existingMachineChecks: Array.isArray(opportunity?.existingMachineChecks)
      ? opportunity.existingMachineChecks.map((c: any) => ({
          item: c?.item || '',
          checked: !!c?.checked,
          note: c?.note || '',
        }))
      : [],

    // Tab 1 — Machine
    // machinePurpose falls back to legacy machineType for existing records
    machinePurpose: opportunity?.machinePurpose || opportunity?.machineType || '',
    machineCategory: opportunity?.machineCategory || '',
    buildType: opportunity?.buildType || 'new',
    // objectType falls back to legacy productApplication
    objectType: opportunity?.objectType || opportunity?.productApplication || '',
    sizeRange: opportunity?.sizeRange || '',
    weightRange: opportunity?.weightRange || '',
    variability: opportunity?.variability ||
      (opportunity?.productVariants === 'Single' ? 'single'
        : opportunity?.productVariants === 'Multiple' ? 'multiple' : ''),
    primaryOperation: opportunity?.primaryOperation || '',
    processType: opportunity?.processType || '',
    processSummary: opportunity?.processSummary || '',
    machineLayout: opportunity?.machineLayout || '',
    // availableSpace falls back to legacy footprint
    availableSpace: opportunity?.availableSpace || opportunity?.footprint || '',
    accessRequirement: opportunity?.accessRequirement || '',
    estimatedModules: arrToStr(opportunity?.estimatedModules),
    complexityLevel: opportunity?.complexityLevel || '',
    automationLevel: normalizeAutomationLevel(opportunity?.automationLevel),
    humanInteraction: opportunity?.humanInteraction || '',
    componentMaterial: opportunity?.componentMaterial || '',
    targetIndustry: opportunity?.targetIndustry || '',
    machineVertical: opportunity?.machineVertical || '',
    quantity: opportunity?.quantity || '',
    inquirySource: opportunity?.inquirySource || '',
    criticalSpec: opportunity?.criticalSpec || '',
    siteVisitStatus: opportunity?.siteVisitStatus || '',
    customerDrawingStatus: opportunity?.customerDrawingStatus || '',

    // Tab 2 — Performance
    // targetOutput falls back to legacy throughputTarget
    targetOutput: opportunity?.targetOutput || opportunity?.throughputTarget || '',
    operationMode: opportunity?.operationMode || '',
    deliveryTargetDate: opportunity?.deliveryTargetDate
      ? new Date(opportunity.deliveryTargetDate).toISOString().slice(0, 10)
      : '',
    priority: opportunity?.priority || 'medium',
    accuracyRequirement: opportunity?.accuracyRequirement || '',
    repeatabilityNeeded: boolToYesNo(opportunity?.repeatabilityNeeded),
    qualityCheckNeeded: boolToYesNo(opportunity?.qualityCheckNeeded),
    environment: (opportunity?.environment || '').toLowerCase() || '',
    environmentNotes: opportunity?.environmentNotes || '',
    operatingHoursPerDay: opportunity?.operatingHoursPerDay != null
      ? String(opportunity.operatingHoursPerDay) : '',
    dutyCycle: opportunity?.dutyCycle || '',
    powerAvailable: opportunity?.powerAvailable || '',
    airAvailable: opportunity?.airAvailable || '',
    otherUtilities: opportunity?.otherUtilities || '',

    // Tab 3 — Constraints
    budgetRange: normalizeBudgetRange(opportunity?.budgetRange),
    // standardsCompliance falls back to legacy complianceRegion
    standardsCompliance: arrToStr(opportunity?.standardsCompliance) ||
      opportunity?.complianceRegion || '',
    preferredTechnology: opportunity?.preferredTechnology || '',
    integrationRequired: boolToYesNo(opportunity?.integrationRequired),
    integrationNotes: opportunity?.integrationNotes || '',
    newConcept: boolToYesNo(opportunity?.newConcept),
    // unclearAreas falls back to legacy specialRequirements / keyRequirements
    unclearAreas: opportunity?.unclearAreas || opportunity?.specialRequirements || '',
    dependency: opportunity?.dependency || '',
    customerContact: opportunity?.customerContact || '',
    internalOwner: opportunity?.internalOwner || '',

    checklistResponses: opportunity?.checklistResponses || [],
  };
}

// ── form → API payload ───────────────────────────────────────────────────────

export function buildOpportunityIntakePayload(form: OpportunityIntakeFormValues) {
  const yesNoToBool = (v: string) =>
    v === 'yes' ? true : v === 'no' ? false : undefined;

  return {
    title: form.title.trim(),
    customerId: form.customerId,
    machineCondition: form.machineCondition,
    existingMachineChecks:
      form.machineCondition === 'existing'
        ? (form.existingMachineChecks || [])
            .map((c) => ({ item: c.item.trim(), checked: !!c.checked, note: (c.note || '').trim() }))
            .filter((c) => c.item.length > 0)
        : [],

    // Tab 1 — Machine
    machinePurpose: form.machinePurpose.trim() || undefined,
    machineCategory: form.machineCategory || undefined,
    buildType: form.buildType || undefined,
    objectType: form.objectType.trim() || undefined,
    sizeRange: form.sizeRange.trim() || undefined,
    weightRange: form.weightRange.trim() || undefined,
    variability: form.variability || undefined,
    primaryOperation: form.primaryOperation.trim() || undefined,
    processType: form.processType || undefined,
    processSummary: form.processSummary.trim() || undefined,
    machineLayout: form.machineLayout || undefined,
    availableSpace: form.availableSpace.trim() || undefined,
    accessRequirement: form.accessRequirement || undefined,
    estimatedModules: form.estimatedModules
      ? form.estimatedModules.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined,
    complexityLevel: form.complexityLevel || undefined,
    automationLevel: form.automationLevel || undefined,
    humanInteraction: form.humanInteraction || undefined,
    componentMaterial: form.componentMaterial || undefined,
    targetIndustry: form.targetIndustry || undefined,
    machineVertical: form.machineVertical || undefined,
    quantity: form.quantity || undefined,
    inquirySource: form.inquirySource || undefined,
    criticalSpec: form.criticalSpec.trim() || undefined,
    siteVisitStatus: form.siteVisitStatus || undefined,
    customerDrawingStatus: form.customerDrawingStatus || undefined,

    // Tab 2 — Performance
    targetOutput: form.targetOutput.trim() || undefined,
    operationMode: form.operationMode || undefined,
    deliveryTargetDate: form.deliveryTargetDate || undefined,
    priority: form.priority || undefined,
    accuracyRequirement: form.accuracyRequirement.trim() || undefined,
    repeatabilityNeeded: yesNoToBool(form.repeatabilityNeeded),
    qualityCheckNeeded: yesNoToBool(form.qualityCheckNeeded),
    environment: form.environment || undefined,
    environmentNotes: form.environmentNotes.trim() || undefined,
    operatingHoursPerDay: form.operatingHoursPerDay
      ? Number(form.operatingHoursPerDay) : undefined,
    dutyCycle: form.dutyCycle || undefined,
    powerAvailable: form.powerAvailable.trim() || undefined,
    airAvailable: form.airAvailable || undefined,
    otherUtilities: form.otherUtilities.trim() || undefined,

    // Tab 3 — Constraints
    budgetRange: form.budgetRange || undefined,
    standardsCompliance: form.standardsCompliance
      ? form.standardsCompliance.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined,
    preferredTechnology: form.preferredTechnology.trim() || undefined,
    integrationRequired: yesNoToBool(form.integrationRequired),
    integrationNotes: form.integrationNotes.trim() || undefined,
    newConcept: yesNoToBool(form.newConcept),
    unclearAreas: form.unclearAreas.trim() || undefined,
    dependency: form.dependency.trim() || undefined,
    customerContact: form.customerContact.trim() || undefined,
    internalOwner: form.internalOwner.trim() || undefined,

    checklistResponses: form.checklistResponses?.length
      ? form.checklistResponses : undefined,
  };
}

// ── validation ───────────────────────────────────────────────────────────────

export function validateOpportunityIntakeForm(
  form: OpportunityIntakeFormValues,
): OpportunityIntakeFieldErrors {
  const errors: OpportunityIntakeFieldErrors = {};

  if (!form.title.trim())
    errors.title = 'Request title is required.';
  if (!form.customerId)
    errors.customerId = 'Select the customer this request belongs to.';
  if (!form.targetOutput.trim())
    errors.targetOutput = 'Target output is required for feasibility estimation.';
  if (!form.deliveryTargetDate)
    errors.deliveryTargetDate = 'Target delivery date is required.';

  return errors;
}

// Legacy — kept for backward compat with any code still importing these
export type CustomRequirement = { title: string; details: string };
export function createEmptyRequirement(): CustomRequirement { return { title: '', details: '' }; }

