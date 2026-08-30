/**
 * opportunities.dto.spec.ts
 *
 * Validates that CreateOpportunityDto, UpdateOpportunityIntakeDto,
 * UpdateOpportunityReviewDto, and UpdateOpportunityStatusDto match the
 * Opportunity Mongoose schema constraints and what the UI intake form sends.
 *
 * Schema source: backend/src/schemas/opportunity.schema.ts
 * UI source:     frontend/src/lib/opportunities.ts  (buildOpportunityIntakePayload)
 */

import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  CreateOpportunityDto,
  UpdateOpportunityIntakeDto,
  UpdateOpportunityReviewDto,
  UpdateOpportunityStatusDto,
  CustomRequirementDto,
  ChecklistResponseDto,
  CreateOpportunityWithCustomerDto,
} from './opportunities.dto';
import { OpportunityStatus, Priority } from '../../common/enums';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_UUID = '8ac46d21-62eb-4e41-96d6-d2d5e516fdd1';

function makeCreate(overrides: object = {}): CreateOpportunityDto {
  return plainToInstance(CreateOpportunityDto, {
    title: 'Conveyor Automation System',
    customerId: VALID_UUID,
    ...overrides,
  });
}

function makeIntakeUpdate(overrides: object = {}): UpdateOpportunityIntakeDto {
  return plainToInstance(UpdateOpportunityIntakeDto, overrides);
}

function makeReviewUpdate(overrides: object = {}): UpdateOpportunityReviewDto {
  return plainToInstance(UpdateOpportunityReviewDto, overrides);
}

function makeStatusUpdate(overrides: object = {}): UpdateOpportunityStatusDto {
  return plainToInstance(UpdateOpportunityStatusDto, overrides);
}

function makeWithCustomer(overrides: object = {}): CreateOpportunityWithCustomerDto {
  return plainToInstance(CreateOpportunityWithCustomerDto, {
    customerId: VALID_UUID,
    title: 'Dry Leak Test Machine',
    machineVertical: 'machine_shop',
    machineCategory: 'Dry Leak Test Machine',
    machineType: 'Dry Leak Test Machine',
    ...overrides,
  });
}

function errorFor(errors: any[], property: string): boolean {
  return errors.some((e) => e.property === property);
}

// ---------------------------------------------------------------------------
// CreateOpportunityDto — required fields
// ---------------------------------------------------------------------------

describe('CreateOpportunityDto — required fields', () => {
  it('accepts a valid minimal payload (title + customerId)', async () => {
    const errors = await validate(makeCreate());
    expect(errors).toHaveLength(0);
  });

  it('rejects when title is missing', async () => {
    const errors = await validate(makeCreate({ title: undefined }));
    expect(errorFor(errors, 'title')).toBe(true);
  });

  it('rejects when title is empty string', async () => {
    const errors = await validate(makeCreate({ title: '' }));
    expect(errorFor(errors, 'title')).toBe(true);
  });

  it('rejects when customerId is missing', async () => {
    const errors = await validate(makeCreate({ customerId: undefined }));
    expect(errorFor(errors, 'customerId')).toBe(true);
  });

  it('rejects a title exceeding 160 characters', async () => {
    const errors = await validate(makeCreate({ title: 'T'.repeat(161) }));
    expect(errorFor(errors, 'title')).toBe(true);
  });

  it('accepts a title at exactly 160 characters', async () => {
    const errors = await validate(makeCreate({ title: 'T'.repeat(160) }));
    expect(errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// CreateOpportunityDto — customerId must be a valid PostgreSQL UUID
// ---------------------------------------------------------------------------

describe('CreateOpportunityDto — customerId UUID validation', () => {
  it('accepts a UUID customerId', async () => {
    const errors = await validate(makeCreate({ customerId: VALID_UUID }));
    expect(errors).toHaveLength(0);
  });

  it('rejects a non-hex customerId', async () => {
    const errors = await validate(makeCreate({ customerId: 'not-an-objectid' }));
    expect(errorFor(errors, 'customerId')).toBe(true);
  });

  it('rejects a customerId that is too short', async () => {
    const errors = await validate(makeCreate({ customerId: '507f1f77' }));
    expect(errorFor(errors, 'customerId')).toBe(true);
  });

  it('rejects a customerId that is too long', async () => {
    const errors = await validate(makeCreate({ customerId: VALID_UUID + '00' }));
    expect(errorFor(errors, 'customerId')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CreateOpportunityDto — numeric axis / motion fields (non-negative integer)
// ---------------------------------------------------------------------------

describe('CreateOpportunityDto — numeric fields are non-negative integers', () => {
  const numericFields = [
    'stationCount',
    'servoAxes',
    'stepperAxes',
    'pneumaticAxes',
    'hydraulicAxes',
    'rotaryIndexers',
    'robots',
    'axisCount',
  ];

  numericFields.forEach((field) => {
    it(`accepts ${field} = 0`, async () => {
      const errors = await validate(makeCreate({ [field]: 0 }));
      expect(errors).toHaveLength(0);
    });

    it(`accepts ${field} = 5`, async () => {
      const errors = await validate(makeCreate({ [field]: 5 }));
      expect(errors).toHaveLength(0);
    });

    it(`rejects ${field} = -1 (negative)`, async () => {
      const errors = await validate(makeCreate({ [field]: -1 }));
      expect(errorFor(errors, field)).toBe(true);
    });

    it(`rejects ${field} as a decimal (e.g. 1.5)`, async () => {
      const errors = await validate(makeCreate({ [field]: 1.5 }));
      expect(errorFor(errors, field)).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// CreateOpportunityDto — string field max length constraints
// ---------------------------------------------------------------------------

describe('CreateOpportunityDto — string field length limits', () => {
  const stringFields: Array<[string, number]> = [
    ['endCustomer', 160],
    ['machineType', 160],
    ['machineLayout', 80],
    ['automationLevel', 80],
    ['productApplication', 160],
    ['productVariants', 80],
    ['robotType', 80],
    ['motionProfile', 160],
    ['motionFeatures', 500],
    ['motionComplexity', 80],
    ['controlPlatform', 160],
    ['controlNotes', 1000],
    ['visionRequired', 80],
    ['processSummary', 1000],
    ['throughputTarget', 200],
    ['safetyLevel', 80],
    ['safetyRequirements', 2000],
    ['complianceRegion', 160],
    ['footprint', 120],
    ['environment', 80],
    ['budgetRange', 80],
    ['specialRequirements', 2000],
  ];

  stringFields.forEach(([field, maxLen]) => {
    it(`rejects ${field} exceeding ${maxLen} characters`, async () => {
      const errors = await validate(makeCreate({ [field]: 'x'.repeat(maxLen + 1) }));
      expect(errorFor(errors, field)).toBe(true);
    });

    it(`accepts ${field} at exactly ${maxLen} characters`, async () => {
      const errors = await validate(makeCreate({ [field]: 'x'.repeat(maxLen) }));
      expect(errors).toHaveLength(0);
    });
  });
});

// ---------------------------------------------------------------------------
// CreateOpportunityDto — priority enum (maps to frontend Priority type)
// ---------------------------------------------------------------------------

describe('CreateOpportunityDto — priority enum', () => {
  const validPriorities: Priority[] = [Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL];

  validPriorities.forEach((p) => {
    it(`accepts priority "${p}"`, async () => {
      const errors = await validate(makeCreate({ priority: p }));
      expect(errors).toHaveLength(0);
    });
  });

  it('rejects an invalid priority "urgent"', async () => {
    const errors = await validate(makeCreate({ priority: 'urgent' }));
    expect(errorFor(errors, 'priority')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CreateOpportunityDto — customRequirements nested DTO
// ---------------------------------------------------------------------------

describe('CreateOpportunityDto — customRequirements', () => {
  it('accepts an empty customRequirements array', async () => {
    const errors = await validate(makeCreate({ customRequirements: [] }));
    expect(errors).toHaveLength(0);
  });

  it('accepts valid customRequirements', async () => {
    const errors = await validate(
      makeCreate({
        customRequirements: [{ title: 'Dust protection', details: 'IP65 minimum' }],
      }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejects customRequirements with a missing title', async () => {
    const errors = await validate(
      makeCreate({
        customRequirements: [{ details: 'No title provided' }],
      }),
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects customRequirements with a title over 120 characters', async () => {
    const errors = await validate(
      makeCreate({
        customRequirements: [{ title: 'T'.repeat(121) }],
      }),
    );
    expect(errors.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// CreateOpportunityDto — checklistResponses nested DTO
// ---------------------------------------------------------------------------

describe('CreateOpportunityDto — checklistResponses', () => {
  it('accepts a valid checklist response', async () => {
    const errors = await validate(
      makeCreate({
        checklistResponses: [{ label: 'Servo axes count?', response: '4' }],
      }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejects a checklist response with a missing label', async () => {
    const errors = await validate(
      makeCreate({
        checklistResponses: [{ response: 'No label' }],
      }),
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects a label exceeding 200 characters', async () => {
    const dto = plainToInstance(ChecklistResponseDto, { label: 'L'.repeat(201) });
    const errors = await validate(dto);
    expect(errorFor(errors, 'label')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// UpdateOpportunityIntakeDto — all fields optional
// ---------------------------------------------------------------------------

describe('UpdateOpportunityIntakeDto — all fields optional', () => {
  it('accepts an empty update body', async () => {
    const errors = await validate(makeIntakeUpdate());
    expect(errors).toHaveLength(0);
  });

  it('accepts a partial update (machineType only)', async () => {
    const errors = await validate(makeIntakeUpdate({ machineType: 'Assembly Line' }));
    expect(errors).toHaveLength(0);
  });

  it('rejects an invalid customerId in update', async () => {
    const errors = await validate(makeIntakeUpdate({ customerId: 'bad-id' }));
    expect(errorFor(errors, 'customerId')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// UpdateOpportunityReviewDto — review fields
// ---------------------------------------------------------------------------

describe('UpdateOpportunityReviewDto', () => {
  it('accepts an empty review update', async () => {
    const errors = await validate(makeReviewUpdate());
    expect(errors).toHaveLength(0);
  });

  it('accepts valid review ratings', async () => {
    const errors = await validate(
      makeReviewUpdate({
        feasibilityRating: 'feasible',
        complexityRating: 'medium',
        riskRating: 'low',
        budgetAlignment: 'on_budget',
        budgetNotes: 'Within quoted range.',
      }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejects assignedReviewer with a non-UUID string', async () => {
    const errors = await validate(makeReviewUpdate({ assignedReviewer: 'not-valid' }));
    expect(errorFor(errors, 'assignedReviewer')).toBe(true);
  });

  it('accepts a valid UUID for assignedReviewer', async () => {
    const errors = await validate(makeReviewUpdate({ assignedReviewer: VALID_UUID }));
    expect(errors).toHaveLength(0);
  });

  it('rejects feasibilityNotes over 2000 characters', async () => {
    const errors = await validate(makeReviewUpdate({ feasibilityNotes: 'x'.repeat(2001) }));
    expect(errorFor(errors, 'feasibilityNotes')).toBe(true);
  });

  it('rejects budgetNotes over 2000 characters', async () => {
    const errors = await validate(makeReviewUpdate({ budgetNotes: 'x'.repeat(2001) }));
    expect(errorFor(errors, 'budgetNotes')).toBe(true);
  });

  // Rating @IsIn constraints — only the four defined values (+ empty string) are accepted
  describe('review rating @IsIn constraints', () => {
    it('rejects an unknown feasibilityRating', async () => {
      const errors = await validate(makeReviewUpdate({ feasibilityRating: 'maybe' }));
      expect(errorFor(errors, 'feasibilityRating')).toBe(true);
    });

    it('accepts empty string for feasibilityRating (clears the rating)', async () => {
      const errors = await validate(makeReviewUpdate({ feasibilityRating: '' }));
      expect(errors).toHaveLength(0);
    });

    it('rejects an unknown complexityRating', async () => {
      const errors = await validate(makeReviewUpdate({ complexityRating: 'extreme' }));
      expect(errorFor(errors, 'complexityRating')).toBe(true);
    });

    it('accepts all valid complexityRating values', async () => {
      for (const val of ['low', 'medium', 'high', 'very_high']) {
        const errors = await validate(makeReviewUpdate({ complexityRating: val }));
        expect(errors).toHaveLength(0);
      }
    });

    it('rejects an unknown riskRating', async () => {
      const errors = await validate(makeReviewUpdate({ riskRating: 'unknown_risk' }));
      expect(errorFor(errors, 'riskRating')).toBe(true);
    });

    it('accepts all valid riskRating values', async () => {
      for (const val of ['low', 'medium', 'high', 'critical']) {
        const errors = await validate(makeReviewUpdate({ riskRating: val }));
        expect(errors).toHaveLength(0);
      }
    });

    it('rejects an unknown budgetAlignment', async () => {
      const errors = await validate(makeReviewUpdate({ budgetAlignment: 'tbd' }));
      expect(errorFor(errors, 'budgetAlignment')).toBe(true);
    });

    it('accepts all valid budgetAlignment values', async () => {
      for (const val of ['on_budget', 'borderline', 'over_budget']) {
        const errors = await validate(makeReviewUpdate({ budgetAlignment: val }));
        expect(errors).toHaveLength(0);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// Workflow gate parity — review note requirement for approve AND reject
// ---------------------------------------------------------------------------
// The service enforces hasRequiredReviewData before both →approved and →rejected.
// These tests use UpdateOpportunityStatusDto validation to confirm the enum
// accepts both values, and document the gate logic with inline assertions.

describe('Workflow gate parity — review notes required for approval AND rejection', () => {
  it('UpdateOpportunityStatusDto accepts "approved" as a valid status', async () => {
    const errors = await validate(makeStatusUpdate({ status: OpportunityStatus.APPROVED }));
    expect(errors).toHaveLength(0);
  });

  it('UpdateOpportunityStatusDto accepts "rejected" as a valid status', async () => {
    const errors = await validate(makeStatusUpdate({ status: OpportunityStatus.REJECTED }));
    expect(errors).toHaveLength(0);
  });

  it('review notes completeness check mirrors service hasRequiredReviewData logic', () => {
    // Inline the service's private method to document the contract
    function hasRequiredReviewData(opp: {
      feasibilityNotes?: string;
      complexityNotes?: string;
      riskNotes?: string;
    }) {
      return Boolean(
        opp.feasibilityNotes?.trim() &&
        opp.complexityNotes?.trim() &&
        opp.riskNotes?.trim(),
      );
    }

    // All three notes present → gate passes (can approve or reject)
    expect(hasRequiredReviewData({
      feasibilityNotes: 'Feasible with caveats',
      complexityNotes: 'High complexity due to custom tooling',
      riskNotes: 'Customer dependency on 3rd-party component',
    })).toBe(true);

    // Missing any one note → gate blocks
    expect(hasRequiredReviewData({ feasibilityNotes: 'ok', complexityNotes: 'ok', riskNotes: '' })).toBe(false);
    expect(hasRequiredReviewData({ feasibilityNotes: 'ok', complexityNotes: '',   riskNotes: 'ok' })).toBe(false);
    expect(hasRequiredReviewData({ feasibilityNotes: '',   complexityNotes: 'ok', riskNotes: 'ok' })).toBe(false);

    // All empty → gate blocks
    expect(hasRequiredReviewData({})).toBe(false);

    // Whitespace-only counts as empty
    expect(hasRequiredReviewData({
      feasibilityNotes: '   ',
      complexityNotes: 'ok',
      riskNotes: 'ok',
    })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// UpdateOpportunityStatusDto — status must be a valid enum value
// ---------------------------------------------------------------------------

describe('UpdateOpportunityStatusDto — status enum', () => {
  const validStatuses = Object.values(OpportunityStatus);

  validStatuses.forEach((status) => {
    it(`accepts status "${status}"`, async () => {
      const errors = await validate(makeStatusUpdate({ status }));
      expect(errors).toHaveLength(0);
    });
  });

  it('rejects when status is missing', async () => {
    const errors = await validate(makeStatusUpdate({ status: undefined }));
    expect(errorFor(errors, 'status')).toBe(true);
  });

  it('rejects an unknown status "pending"', async () => {
    const errors = await validate(makeStatusUpdate({ status: 'pending' }));
    expect(errorFor(errors, 'status')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Payload field name alignment — UI buildOpportunityIntakePayload → DTO
// The frontend maps internal form names to the correct API field names.
// These tests verify the API field names exist as DTO properties.
// ---------------------------------------------------------------------------

describe('Opportunity payload field name alignment (UI → DTO)', () => {
  // Keys emitted by frontend buildOpportunityIntakePayload (non-undefined case)
  const uiPayloadFields: (keyof UpdateOpportunityIntakeDto)[] = [
    'title',
    'customerId',
    'machineType',
    'machineLayout',
    'automationLevel',
    'productApplication',  // mapped from form.product
    'productVariants',
    'stationCount',
    'processSummary',
    'throughputTarget',
    'deliveryTargetDate',
    'servoAxes',
    'stepperAxes',
    'pneumaticAxes',
    'hydraulicAxes',
    'rotaryIndexers',
    'robots',
    'robotType',
    'motionProfile',
    'motionFeatures',
    'motionComplexity',
    'controlPlatform',
    'controlNotes',
    'visionRequired',
    'safetyLevel',
    'complianceRegion',    // mapped from form.compliance
    'footprint',
    'environment',
    'specialRequirements', // mapped from form.keyRequirements
    'budgetRange',
    'checklistResponses',
  ];

  it('all UI payload fields are recognised by CreateOpportunityDto (no unknown field errors)', async () => {
    const payload: any = {
      title: 'Test',
      customerId: VALID_UUID,
    };

    // Add all optional fields with minimal valid values
    uiPayloadFields.forEach((field) => {
      if (!['title', 'customerId', 'stationCount', 'servoAxes', 'stepperAxes',
            'pneumaticAxes', 'hydraulicAxes', 'rotaryIndexers', 'robots',
            'checklistResponses', 'deliveryTargetDate'].includes(field)) {
        payload[field] = 'test';
      }
    });
    payload.stationCount = 2;
    payload.servoAxes = 4;
    payload.stepperAxes = 0;
    payload.pneumaticAxes = 0;
    payload.hydraulicAxes = 0;
    payload.rotaryIndexers = 0;
    payload.robots = 1;
    payload.checklistResponses = [];
    payload.deliveryTargetDate = '2025-12-31';

    const dto = plainToInstance(CreateOpportunityDto, payload);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// machineCondition + existingMachineChecks (new vs existing machine intake)
// ---------------------------------------------------------------------------

describe('CreateOpportunityDto — machineCondition', () => {
  it('accepts machineCondition "new"', async () => {
    const dto = makeCreate({ machineCondition: 'new' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts machineCondition "existing"', async () => {
    const dto = makeCreate({ machineCondition: 'existing' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts when machineCondition is omitted (defaults to new on the schema side)', async () => {
    const dto = makeCreate({});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects an unknown machineCondition value', async () => {
    const dto = makeCreate({ machineCondition: 'refurb' });
    const errors = await validate(dto);
    const conditionErr = errors.find((e) => e.property === 'machineCondition');
    expect(conditionErr).toBeDefined();
    expect(conditionErr?.constraints?.isIn).toBeDefined();
  });
});

describe('CreateOpportunityDto — existingMachineChecks', () => {
  it('accepts an empty existingMachineChecks array', async () => {
    const dto = makeCreate({ existingMachineChecks: [] });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts valid existingMachineChecks entries', async () => {
    const dto = makeCreate({
      machineCondition: 'existing',
      existingMachineChecks: [
        { item: 'Existing electrical drawings available', checked: true, note: 'Provided by customer' },
        { item: 'Site survey completed', checked: false },
      ],
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects existingMachineChecks with a missing item label', async () => {
    const dto = makeCreate({
      existingMachineChecks: [{ checked: true, note: 'no label' }],
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects existingMachineChecks with item exceeding 200 characters', async () => {
    const dto = makeCreate({
      existingMachineChecks: [{ item: 'x'.repeat(201), checked: false }],
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects existingMachineChecks with note exceeding 500 characters', async () => {
    const dto = makeCreate({
      existingMachineChecks: [{ item: 'Short', checked: false, note: 'n'.repeat(501) }],
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects existingMachineChecks with non-boolean checked', async () => {
    const dto = makeCreate({
      existingMachineChecks: [{ item: 'Drawings', checked: 'yes' as any }],
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects more than 50 existingMachineChecks entries', async () => {
    const tooMany = Array.from({ length: 51 }, (_, i) => ({ item: `check-${i}`, checked: false }));
    const dto = makeCreate({ existingMachineChecks: tooMany });
    const errors = await validate(dto);
    const arrErr = errors.find((e) => e.property === 'existingMachineChecks');
    expect(arrErr).toBeDefined();
    expect(arrErr?.constraints?.arrayMaxSize).toBeDefined();
  });
});

describe('UpdateOpportunityIntakeDto — machineCondition + existingMachineChecks', () => {
  it('accepts a partial update with only machineCondition', async () => {
    const dto = makeIntakeUpdate({ machineCondition: 'existing' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts a partial update with only existingMachineChecks', async () => {
    const dto = makeIntakeUpdate({
      existingMachineChecks: [{ item: 'PLC program available', checked: true, note: '' }],
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

describe('CreateOpportunityWithCustomerDto — wizard-derived schema fields', () => {
  it('accepts summary fields derived from the machine checklist', async () => {
    const dto = makeWithCustomer({
      deliveryTargetDate: '2026-08-15',
      targetOutput: '100 units/shift; 10 secs',
      criticalSpec: '10 CCM; Mass flow',
      componentMaterial: 'Aluminium',
      sizeRange: '280 x 180 x 120 mm',
      checklistResponses: [
        { label: 'Expected installation date', response: '2026-08-15' },
        { label: 'DataLogging / Traceability', response: 'MES/SCADA upload' },
      ],
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects a non-ISO deliveryTargetDate', async () => {
    const dto = makeWithCustomer({ deliveryTargetDate: '15/08/2026' });
    const errors = await validate(dto);
    expect(errorFor(errors, 'deliveryTargetDate')).toBe(true);
  });

  it('rejects more than 30 checklist responses from the wizard', async () => {
    const dto = makeWithCustomer({
      checklistResponses: Array.from({ length: 31 }, (_, i) => ({
        label: `Question ${i + 1}`,
        response: 'Answer',
      })),
    });
    const errors = await validate(dto);
    expect(errorFor(errors, 'checklistResponses')).toBe(true);
  });
});
