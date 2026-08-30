import { Prop, Schema, SchemaFactory } from '../database/postgres-document.types';
import { DatabaseId, Document } from '../database/postgres-document.types';
import { OpportunityIntakeMode, OpportunityStatus, Priority } from '../common/enums';

@Schema({ _id: false })
export class CustomRequirement {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  details: string;
}

export const CustomRequirementSchema = SchemaFactory.createForClass(CustomRequirement);

@Schema({ _id: false })
export class ReferencePhoto {
  @Prop({ required: true, trim: true })
  url: string;

  @Prop({ trim: true })
  caption: string;

  @Prop({ trim: true, default: 'reference' })
  kind: string; // photo | sketch | rfq | reference

  @Prop({ type: DatabaseId, ref: 'User' })
  uploadedBy: DatabaseId;

  @Prop({ type: Date, default: () => new Date() })
  uploadedAt: Date;
}

export const ReferencePhotoSchema = SchemaFactory.createForClass(ReferencePhoto);

@Schema({ _id: false })
export class ChecklistResponse {
  @Prop({ required: true, trim: true })
  label: string;

  @Prop({ trim: true, default: '' })
  response: string;
}

export const ChecklistResponseSchema = SchemaFactory.createForClass(ChecklistResponse);

@Schema({ _id: false })
export class ExistingMachineCheck {
  @Prop({ required: true, trim: true })
  item: string;

  @Prop({ type: Boolean, default: false })
  checked: boolean;

  @Prop({ trim: true, default: '' })
  note: string;
}

export const ExistingMachineCheckSchema = SchemaFactory.createForClass(ExistingMachineCheck);

@Schema({ timestamps: true })
export class Opportunity extends Document {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: DatabaseId, ref: 'Customer', required: true })
  customerId: DatabaseId;

  @Prop({ trim: true })
  endCustomer: string;

  // Is this a brand-new build or an existing machine being modified/retrofitted?
  @Prop({ enum: ['new', 'existing'], default: 'new' })
  machineCondition: string;

  // When machineCondition === 'existing', a checklist of items to assess on the existing unit.
  @Prop({ type: [ExistingMachineCheckSchema], default: [] })
  existingMachineChecks: ExistingMachineCheck[];

  // Tab 1 — Machine
  @Prop({ trim: true })
  machineType: string;

  @Prop({ trim: true })
  machineLayout: string;

  @Prop({ trim: true })
  automationLevel: string;

  @Prop({ trim: true })
  productApplication: string;

  @Prop({ trim: true })
  productVariants: string;

  @Prop({ type: Number })
  stationCount: number;

  @Prop({ trim: true })
  processSummary: string;

  @Prop({ type: Number })
  axisCount: number;

  @Prop({ type: Number })
  servoAxes: number;

  @Prop({ type: Number })
  stepperAxes: number;

  @Prop({ type: Number })
  pneumaticAxes: number;

  @Prop({ type: Number })
  hydraulicAxes: number;

  @Prop({ type: Number })
  rotaryIndexers: number;

  @Prop({ type: Number })
  robots: number;

  @Prop({ trim: true })
  robotType: string;

  @Prop({ trim: true })
  motionProfile: string;

  @Prop({ trim: true })
  motionFeatures: string;

  @Prop({ trim: true })
  motionComplexity: string;

  @Prop({ trim: true })
  controlPlatform: string;

  @Prop({ trim: true })
  controlNotes: string;

  @Prop({ trim: true })
  visionRequired: string;

  // Tab 2 — Performance
  @Prop({ trim: true })
  throughputTarget: string;

  @Prop({ type: Date })
  deliveryTargetDate: Date;

  // Tab 3 — Constraints
  @Prop({ trim: true })
  safetyLevel: string;

  @Prop({ trim: true })
  safetyRequirements: string;

  @Prop({ trim: true })
  complianceRegion: string;

  @Prop({ trim: true })
  footprint: string;

  @Prop({ trim: true })
  environment: string;

  @Prop({ trim: true })
  budgetRange: string;

  @Prop({ trim: true })
  budgetNotes: string;

  @Prop({ trim: true })
  specialRequirements: string;

  @Prop({ type: [CustomRequirementSchema], default: [] })
  customRequirements: CustomRequirement[];

  // ── OEM Generic Fields — Tab 1 extensions ────────────────────────────────
  // machinePurpose replaces machineType as the primary free-text description.
  // machineType is kept for backward compat.
  @Prop({ trim: true })
  machinePurpose: string;

  @Prop({ trim: true }) // handling | processing | assembly | testing | inspection | custom
  machineCategory: string;

  @Prop({ trim: true }) // new | retrofit | upgrade | clone
  buildType: string;

  // Work Object
  @Prop({ trim: true })
  objectType: string;

  @Prop({ trim: true })
  sizeRange: string;

  @Prop({ trim: true })
  weightRange: string;

  @Prop({ trim: true }) // single | multiple | unknown
  variability: string;

  // Process Definition
  @Prop({ trim: true })
  primaryOperation: string;

  @Prop({ trim: true }) // continuous | discrete | batch | unknown
  processType: string;

  // Layout & Space
  @Prop({ trim: true })
  availableSpace: string;

  @Prop({ trim: true }) // operator | maintenance | both | unknown
  accessRequirement: string;

  // Machine Structure
  @Prop({ type: [String], default: [] })
  estimatedModules: string[];

  @Prop({ trim: true }) // low | medium | high
  complexityLevel: string;

  @Prop({ trim: true }) // high | medium | low
  humanInteraction: string;

  // Component material — e.g. al_casting | cast_iron | plastic | rubber | steel | other
  @Prop({ trim: true })
  componentMaterial: string;

  // Target industry — e.g. automotive | foundry | plastic_rubber | general_eng | other
  @Prop({ trim: true })
  targetIndustry: string;

  // ── OEM Generic Fields — Tab 2 extensions ────────────────────────────────
  // targetOutput replaces throughputTarget. throughputTarget kept for backward compat.
  @Prop({ trim: true })
  targetOutput: string;

  @Prop({ trim: true }) // continuous | cycle_based | unknown
  operationMode: string;

  @Prop({ trim: true })
  accuracyRequirement: string;

  @Prop({ type: Boolean })
  repeatabilityNeeded: boolean;

  @Prop({ type: Boolean })
  qualityCheckNeeded: boolean;

  @Prop({ trim: true })
  environmentNotes: string;

  @Prop({ type: Number })
  operatingHoursPerDay: number;

  @Prop({ trim: true }) // light | medium | heavy
  dutyCycle: string;

  @Prop({ trim: true })
  powerAvailable: string;

  @Prop({ trim: true }) // yes | no | unknown
  airAvailable: string;

  @Prop({ trim: true })
  otherUtilities: string;

  // ── OEM Generic Fields — Tab 3 extensions ────────────────────────────────
  @Prop({ type: [String], default: [] })
  standardsCompliance: string[];

  @Prop({ trim: true })
  preferredTechnology: string;

  @Prop({ type: Boolean })
  integrationRequired: boolean;

  @Prop({ trim: true })
  integrationNotes: string;

  @Prop({ type: Boolean })
  newConcept: boolean;

  @Prop({ trim: true })
  unclearAreas: string;

  @Prop({ trim: true })
  dependency: string;

  @Prop({ trim: true })
  customerContact: string;

  @Prop({ trim: true })
  internalOwner: string;

  @Prop({ enum: Priority, default: Priority.MEDIUM })
  priority: Priority;

  @Prop({ enum: OpportunityStatus, default: OpportunityStatus.DRAFT })
  status: OpportunityStatus;

  @Prop({ trim: true, unique: true, sparse: true, index: true })
  requestNo: string;

  @Prop({ enum: OpportunityIntakeMode, default: OpportunityIntakeMode.BLANK })
  intakeMode: OpportunityIntakeMode;

  @Prop({ type: DatabaseId, ref: 'MachineTemplate', default: null })
  templateId: DatabaseId | null;

  @Prop({ type: [ReferencePhotoSchema], default: [] })
  referencePhotos: ReferencePhoto[];

  // Template checklist responses (one entry per checklist item)
  @Prop({ type: [ChecklistResponseSchema], default: [] })
  checklistResponses: ChecklistResponse[];

  @Prop({ type: DatabaseId, ref: 'User', required: true })
  createdBy: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'User' })
  assignedReviewer: DatabaseId;

  // Review — structured ratings
  @Prop({ trim: true })
  feasibilityRating: string; // 'feasible' | 'conditional' | 'not_feasible'

  @Prop({ trim: true })
  feasibilityNotes: string;

  @Prop({ trim: true })
  complexityRating: string; // 'low' | 'medium' | 'high' | 'very_high'

  @Prop({ trim: true })
  complexityNotes: string;

  @Prop({ trim: true })
  riskRating: string; // 'low' | 'medium' | 'high' | 'critical'

  @Prop({ trim: true })
  riskNotes: string;

  @Prop({ trim: true })
  budgetAlignment: string; // 'on_budget' | 'borderline' | 'over_budget'

  @Prop({ type: [String], default: [] })
  attachments: string[];

  // ── Macpro SPM intake fields ────────────────────────────────────────────────
  @Prop({ trim: true }) machineVertical: string; // foundry | machine_shop | spm | fabrication
  @Prop({ trim: true }) quantity: string; // '1' | '2' | '3_5' | '5_plus'
  @Prop({ trim: true }) inquirySource: string; // rfq | email | site_visit | phone | reference | repeat
  @Prop({ trim: true }) criticalSpec: string; // adaptive performance spec
  @Prop({ trim: true }) siteVisitStatus: string; // yes | no | planned
  @Prop({ trim: true }) customerDrawingStatus: string; // yes | no | pending

  @Prop({ type: DatabaseId, ref: 'Project' })
  convertedProjectId: DatabaseId;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const OpportunitySchema = SchemaFactory.createForClass(Opportunity);
OpportunitySchema.index({ status: 1 });
OpportunitySchema.index({ customerId: 1 });
OpportunitySchema.index({ createdBy: 1 });
