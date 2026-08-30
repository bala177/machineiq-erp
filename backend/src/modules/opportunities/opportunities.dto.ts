import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { OpportunityStatus, Priority, ProjectHealth, ProjectStage } from '../../common/enums';

export class CustomRequirementDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  details?: string;
}

export class ChecklistResponseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  label: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  response?: string;
}

export class ExistingMachineCheckDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  item: string;

  @IsOptional()
  @IsBoolean()
  checked?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

class OpportunityIntakeFieldsDto {
  // title and customerId are declared in concrete DTOs only (required in Create, optional in Update)
  // to avoid @IsOptional() from this base class overriding @IsNotEmpty() in child classes.

  @IsOptional()
  @IsString()
  @MaxLength(160)
  endCustomer?: string;

  // Is this a brand-new build or an existing machine being modified/retrofitted?
  @IsOptional()
  @IsIn(['new', 'existing'])
  machineCondition?: 'new' | 'existing';

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ExistingMachineCheckDto)
  existingMachineChecks?: ExistingMachineCheckDto[];

  // Tab 1 — Machine
  @IsOptional()
  @IsString()
  @MaxLength(160)
  machineType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  machineLayout?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  automationLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  productApplication?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  productVariants?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stationCount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  servoAxes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stepperAxes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pneumaticAxes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  hydraulicAxes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  rotaryIndexers?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  robots?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  robotType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  motionProfile?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  motionFeatures?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  motionComplexity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  controlPlatform?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  controlNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  visionRequired?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  processSummary?: string;

  // Tab 2 — Performance
  @IsOptional()
  @IsString()
  @MaxLength(200)
  throughputTarget?: string;

  @IsOptional()
  @IsDateString()
  deliveryTargetDate?: string;

  // Tab 3 — Constraints
  @IsOptional()
  @IsString()
  @MaxLength(80)
  safetyLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  safetyRequirements?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  complianceRegion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  footprint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  environment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  budgetRange?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  specialRequirements?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  axisCount?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CustomRequirementDto)
  customRequirements?: CustomRequirementDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => ChecklistResponseDto)
  checklistResponses?: ChecklistResponseDto[];

  // ── OEM Generic Fields — Tab 1 extensions ────────────────────────────────
  @IsOptional()
  @IsString()
  @MaxLength(300)
  machinePurpose?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  machineCategory?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  buildType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  objectType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sizeRange?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  weightRange?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  variability?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  primaryOperation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  processType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  availableSpace?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  accessRequirement?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  estimatedModules?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(40)
  complexityLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  humanInteraction?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  componentMaterial?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  targetIndustry?: string;

  // ── OEM Generic Fields — Tab 2 extensions ────────────────────────────────
  @IsOptional()
  @IsString()
  @MaxLength(300)
  targetOutput?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  operationMode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  accuracyRequirement?: string;

  @IsOptional()
  @IsBoolean()
  repeatabilityNeeded?: boolean;

  @IsOptional()
  @IsBoolean()
  qualityCheckNeeded?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  environmentNotes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  operatingHoursPerDay?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  dutyCycle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  powerAvailable?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  airAvailable?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  otherUtilities?: string;

  // ── OEM Generic Fields — Tab 3 extensions ────────────────────────────────
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  standardsCompliance?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(300)
  preferredTechnology?: string;

  @IsOptional()
  @IsBoolean()
  integrationRequired?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  integrationNotes?: string;

  @IsOptional()
  @IsBoolean()
  newConcept?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  unclearAreas?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  dependency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  customerContact?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  internalOwner?: string;

  // ── Macpro SPM intake fields ────────────────────────────────────────────────
  @IsOptional()
  @IsString()
  @MaxLength(80)
  machineVertical?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  quantity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  inquirySource?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  criticalSpec?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  siteVisitStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  customerDrawingStatus?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  attachments?: string[];
}

export class CreateOpportunityDto extends OpportunityIntakeFieldsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title: string;

  @IsString()
  @IsUUID('4', { message: 'customerId must be a valid UUID' })
  customerId: string;

  @IsOptional()
  @IsUUID('4', { message: 'templateId must be a valid UUID' })
  templateId?: string;
}

export class UpdateOpportunityIntakeDto extends OpportunityIntakeFieldsDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsUUID('4', { message: 'customerId must be a valid UUID' })
  customerId?: string;
}

export class CreateOpportunityFromTemplateDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsString()
  @IsUUID('4', { message: 'customerId must be a valid UUID' })
  customerId: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  endCustomer?: string;
}

export class ReferencePhotoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4500000)
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  caption?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  kind?: string;
}

export class UpdateOpportunityReviewDto {
  @IsOptional()
  @IsUUID('4', { message: 'assignedReviewer must be a valid UUID' })
  assignedReviewer?: string;

  @IsOptional()
  @IsIn(['', 'feasible', 'conditional', 'not_feasible'])
  feasibilityRating?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  feasibilityNotes?: string;

  @IsOptional()
  @IsIn(['', 'low', 'medium', 'high', 'very_high'])
  complexityRating?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  complexityNotes?: string;

  @IsOptional()
  @IsIn(['', 'low', 'medium', 'high', 'critical'])
  riskRating?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  riskNotes?: string;

  @IsOptional()
  @IsIn(['', 'on_budget', 'borderline', 'over_budget'])
  budgetAlignment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  budgetNotes?: string;
}

export class UpdateOpportunityStatusDto {
  @IsEnum(OpportunityStatus)
  status: OpportunityStatus;
}

export class ConvertOpportunityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsUUID('4', { message: 'customerId must be a valid UUID' })
  customerId?: string;

  @IsUUID('4', { message: 'projectManagerId must be a valid UUID' })
  projectManagerId: string;

  @IsOptional()
  @IsEnum(ProjectStage)
  stage?: ProjectStage;

  @IsOptional()
  @IsEnum(ProjectHealth)
  health?: ProjectHealth;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsDateString()
  targetDeliveryDate?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;
}

export class InlineCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  industry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactPerson?: string;

  @IsOptional()
  @IsString()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;
}

export class CreateOpportunityWithCustomerDto {
  @IsOptional()
  @IsUUID('4', { message: 'customerId must be a valid UUID' })
  customerId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => InlineCustomerDto)
  newCustomer?: InlineCustomerDto;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  endCustomer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsUUID('4', { message: 'templateId must be a valid UUID' })
  templateId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  machineVertical?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  machineCategory?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  machineType?: string;

  @IsOptional()
  @IsDateString()
  deliveryTargetDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  targetOutput?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  criticalSpec?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  componentMaterial?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sizeRange?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => ChecklistResponseDto)
  checklistResponses?: ChecklistResponseDto[];
}
