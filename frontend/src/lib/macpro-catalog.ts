/**
 * Macpro Automation machine catalog — single source of truth.
 *
 * Source: scraped from https://www.macproautomation.com/industries.html
 * (Foundry / Machine Shop / SPM / Fabrication tabs).
 *
 * Used by:
 *   - frontend/src/app/(app)/opportunities/new/page.tsx (machine gallery)
 *   - frontend/src/components/opportunities/opportunity-intake-fields.tsx (dropdowns)
 *
 * Backend persists `machineVertical` (id) and `machineCategory` (machine name)
 * on the Opportunity document. Schema validation:
 *   - machineVertical: max 80 chars
 *   - machineCategory: max 120 chars
 */

export type MacproMachine = {
  name: string;
  description: string;
};

export type MacproChecklistItemType =
  | 'textarea'       // multi-line free text (default for most machines)
  | 'text'           // single-line text input
  | 'date'           // calendar date input, stored as yyyy-mm-dd
  | 'number'         // numeric input with optional unit label
  | 'select_one'     // exactly one option (radio-style pill buttons)
  | 'select_many'    // any number of options (checkbox-style pill buttons)
  | 'circuit_table'; // 4-row table: circuit name + test pressure (Kg/sqcm)

export type MacproChecklistItem = {
  label: string;
  hint?: string;
  required?: boolean;
  /** Input type rendered in the checklist modal. Defaults to 'textarea'. */
  type?: MacproChecklistItemType;
  /** Option strings for select_one and select_many fields. */
  options?: string[];
  /** Unit label displayed after a number input (e.g. 'CCM', 'secs'). */
  unit?: string;
  /** Section heading used to visually group related fields in the modal. */
  section?: string;
};

export type MacproVerticalId = 'foundry' | 'machine_shop' | 'spm' | 'fabrication';

export type MacproVertical = {
  id: MacproVerticalId;
  label: string;
  /** Used by the dropdown <select> in the intake form. */
  shortLabel: string;
  machines: MacproMachine[];
};

export const MACPRO_CATALOG: MacproVertical[] = [
  {
    id: 'foundry',
    label: 'Foundry Equipments',
    shortLabel: 'Foundry',
    machines: [
      { name: 'Core Shooting Machine',         description: 'Automated sand core shooting for foundry casting lines.' },
      { name: 'Raiser Cutting Machine',        description: 'Precision removal of risers and gates from cast components.' },
      { name: 'Decoring Machine',              description: 'Vibratory or hydraulic sand core removal from castings.' },
      { name: 'Core Drilling Machine',         description: 'CNC-driven drilling station for foundry core operations.' },
      { name: 'Gravity Die Cast Machine',      description: 'Semi-auto or full-auto die casting with tilt capability.' },
      { name: 'Jet Cooling Closed Loop System', description: 'Controlled closed-loop jet cooling for die temperature management.' },
      { name: 'Jet Cooling Open Loop System',  description: 'High-flow open-loop jet cooling for rapid solidification.' },
      { name: 'High Pressure Cooling Machine', description: 'High-pressure coolant delivery to critical die zones.' },
      { name: 'Pump Cooling Machine',          description: 'Recirculating pump-driven cooling circuit for foundry tooling.' },
    ],
  },
  {
    id: 'machine_shop',
    label: 'Machine Shop Equipments',
    shortLabel: 'Machine Shop',
    machines: [
      { name: 'Wet Leak Test Machine',                   description: 'Submerged bubble-detection leak test for complex geometries.' },
      { name: 'Dry Leak Test Machine',                   description: 'Air-pressure leak detection — no water, clean-room compatible.' },
      { name: 'Washing & Drying Machine',                description: 'Aqueous wash + hot-air dry cycle for machined components.' },
      { name: '9S Planetary Washing Machine',            description: '9-station planetary carrier wash system for high-volume parts.' },
      { name: 'Conveyor Washing Machine',                description: 'Inline conveyor parts washer for continuous production flow.' },
      { name: 'Ultrasonic Washing Machine',              description: 'Ultrasonic cavitation cleaning for precision components.' },
      { name: 'Final Washing & Airbow Station',          description: 'Final clean and air-blow station before assembly or dispatch.' },
      { name: 'Gear Housing Washing Machine',            description: 'Dedicated wash station for gear housing castings.' },
      { name: 'Washing cum Drying Machine',              description: 'Combined single-machine wash and dry for compact lines.' },
      { name: 'Adaptor Washing Machine',                 description: 'Specialised washer configured for adaptor components.' },
      { name: 'Gear Housing Washing & Drying Machine',   description: 'Combined wash + dry dedicated for gear housing geometry.' },
      { name: 'Washing & Rinsing Machine',               description: 'Multi-stage wash and rinse for high-cleanliness requirements.' },
      { name: 'Assembly Station',                        description: 'Ergonomic assembly workstation with poka-yoke fixtures.' },
      { name: 'EOL Tester',                              description: 'End-of-line functional test rig with automated pass/fail logging.' },
      { name: 'LOFH Assembly Station',                   description: 'LOFH-specific assembly station with guided process control.' },
      { name: 'Housing Oil Cooler Assembly Machine',     description: 'Dedicated machine for oil cooler housing sub-assembly.' },
      { name: 'Support Fairing Assembly Machine',        description: 'Precision assembly station for support fairing structures.' },
      { name: 'ISX Gear Housing Assembly Station',       description: 'ISX engine gear housing dedicated assembly station.' },
      { name: 'TCC Loctite Dispensing Station',          description: 'Controlled Loctite dispensing station for TCC components.' },
    ],
  },
  {
    id: 'spm',
    label: 'SPM',
    shortLabel: 'SPM',
    machines: [
      { name: '2 Ton Press',  description: 'Compact 2-ton hydraulic / pneumatic press for light press-fit operations.' },
      { name: 'Auto Loader',  description: 'Automated part loading system for press and SPM integration.' },
      { name: '180 Ton Press', description: 'Heavy-duty 180-ton hydraulic press for high-force press-fit assemblies.' },
    ],
  },
  {
    id: 'fabrication',
    label: 'Fabrication',
    shortLabel: 'Fabrication',
    machines: [
      { name: 'Pallet Lifter', description: 'Fabricated pallet lifting and transfer structure for production lines.' },
      { name: 'Tool Rack',     description: 'Fabricated tool rack for organised workstation tooling storage.' },
    ],
  },
];

/** Lookup helper. Returns undefined for unknown ids. */
export const getVerticalById = (id?: string | null): MacproVertical | undefined =>
  id ? MACPRO_CATALOG.find((v) => v.id === id) : undefined;

/** Returns the canonical machine list for a given vertical id, or [] if unknown. */
export const machinesForVertical = (id?: string | null): MacproMachine[] =>
  getVerticalById(id)?.machines ?? [];

/** Vertical {value,label} list for <select> dropdowns. */
export const VERTICAL_OPTIONS = MACPRO_CATALOG.map((v) => ({
  value: v.id,
  label: v.shortLabel,
}));

/** Map vertical id -> array of machine name strings (legacy shape used by intake form). */
export const MACHINES_BY_VERTICAL: Record<string, string[]> = MACPRO_CATALOG.reduce(
  (acc, v) => {
    acc[v.id] = v.machines.map((m) => m.name);
    return acc;
  },
  {} as Record<string, string[]>,
);

/** All known machine names across every vertical (for cross-validation / autocomplete). */
export const ALL_MACHINE_NAMES: string[] = MACPRO_CATALOG.flatMap((v) =>
  v.machines.map((m) => m.name),
);

/** True if `name` belongs to the given vertical's catalog. */
export const isCatalogMachine = (verticalId: string | null | undefined, name: string | null | undefined): boolean => {
  if (!verticalId || !name) return false;
  return machinesForVertical(verticalId).some((m) => m.name === name);
};

// ─────────────────────────────────────────────────────────────────────────────
// Checklists
//
// Structure mirrors the Macpro Automation RFQ form (hard-truth source):
//   docs/customer-references/Dry_Leak_Test.pdf
//
// Field order per machine: component info → process params → machine config
//   → handling/production → controls/preferences → traceability → timeline.
//
// If a machine has a full override, getMachineChecklist returns it exclusively.
// Machines without an override fall back to infer + vertical + base layers.
// ─────────────────────────────────────────────────────────────────────────────

// Fallback base questions used only when no machine-specific override exists.
const BASE_MACHINE_CHECKLIST: MacproChecklistItem[] = [
  { label: 'Component drawing or sample available?', hint: 'Drawing revision, sample count, or reference photo status.', required: true },
  { label: 'Target cycle time and output', hint: 'Units per shift, seconds per part, or takt target.', required: true },
  { label: 'Component size and weight', hint: 'Min/max dimensions (L×W×H mm) and part weight.', required: true },
  { label: 'Utilities available at site', hint: 'Power, compressed air, water, coolant, exhaust, hydraulic supply.', required: false },
  { label: 'Acceptance criteria for trials', hint: 'Pass/fail limits: dimensional, leak, cleanliness, force, temperature, visual.', required: true },
];

// Fallback vertical questions used only when no machine-specific override exists.
const VERTICAL_CHECKLIST: Record<MacproVerticalId, MacproChecklistItem[]> = {
  foundry: [
    { label: 'Casting alloy and temperature range', hint: 'Material grade, pour/die temperature, thermal limits.', required: true },
    { label: 'Sand / core / riser details', hint: 'Core geometry, sand type, riser location, removal method.', required: false },
    { label: 'Foundry environment constraints', hint: 'Heat, dust, coolant, guarding, operator access.', required: true },
  ],
  machine_shop: [
    { label: 'Process before and after this station', hint: 'Previous and next process, burr, oil, chip condition.', required: true },
    { label: 'Cleanliness or test standard', hint: 'Leak rate, particle limit, drying target, function test limits.', required: true },
    { label: 'Fixture and changeover expectations', hint: 'Dedicated fixture, family fixture, manual or quick-change.', required: false },
  ],
  spm: [
    { label: 'Press / load / motion requirement', hint: 'Force, stroke, speed, dwell, position accuracy.', required: true },
    { label: 'Control sequence and interlocks', hint: 'Operator actions, sensors, safety gates, pass/fail logic.', required: true },
    { label: 'Special tooling scope', hint: 'Fixtures, nests, punches, grippers, probes, gauges.', required: false },
  ],
  fabrication: [
    { label: 'Fabrication material and finish', hint: 'MS/SS/aluminium, paint, powder coat, plating.', required: true },
    { label: 'Load rating and safety factor', hint: 'Working load, dynamic load, deflection, locking needs.', required: true },
    { label: 'Interface points', hint: 'Mounting holes, floor anchors, machine-side interfaces.', required: false },
  ],
};

// ─── Machine-specific overrides (complete RFQ-based checklists) ───────────────
// When present, these replace ALL other layers for that machine.

const MACHINE_CHECKLIST_OVERRIDES: Record<string, MacproChecklistItem[]> = {

  // ── LEAK TEST MACHINES ─────────────────────────────────────────────────────
  // Source of truth: docs/customer-references/Dry_Leak_Test.pdf
  // Every field on the real Macpro Automation RFQ form is represented here
  // with the matching input type (select, number, circuit_table, text).
  // Section labels mirror the PDF layout sections.

  'Dry Leak Test Machine': [
    // ── Component ──────────────────────────────────────────────────────────
    { section: 'Component', label: 'Component material', type: 'text', hint: 'e.g. Aluminium, Cast Iron, Steel', required: true },
    { section: 'Component', label: 'Component size (L×W×H mm)', type: 'text', hint: 'Overall envelope dimensions in mm', required: true },
    { section: 'Component', label: 'Number of variants', type: 'number', unit: 'variants', hint: 'Part variants to be tested on this machine', required: true },
    // ── Leak specification ─────────────────────────────────────────────────
    { section: 'Leak specification', label: 'Test circuits and pressures', type: 'circuit_table', hint: 'Circuit name and test pressure (Kg/sqcm) — up to 4 circuits', required: true },
    { section: 'Leak specification', label: 'Acceptable leak rate', type: 'number', unit: 'CCM', required: true },
    { section: 'Leak specification', label: 'Test method', type: 'select_one', options: ['Pressure decay', 'Mass flow', 'Helium'], required: true },
    // ── Assembly stage ─────────────────────────────────────────────────────
    { section: 'Assembly stage', label: 'Child part sub-assembly present?', type: 'select_one', options: ['Yes', 'No'], required: true },
    { section: 'Assembly stage', label: 'Leak test timing', type: 'select_many', options: ['Before assembly', 'After assembly'], hint: 'Select when leak test is performed', required: false },
    // ── Machine configuration ──────────────────────────────────────────────
    { section: 'Machine configuration', label: 'Machine type', type: 'select_one', options: ['Standalone', 'Conveyor', 'Rotary Indexing'], required: true },
    { section: 'Machine configuration', label: 'Number of test stations', type: 'number', unit: 'stations', required: true },
    { section: 'Machine configuration', label: 'Component loading method', type: 'select_one', options: ['Manual', 'Semi-automatic', 'Automated'], required: true },
    { section: 'Machine configuration', label: 'Component unloading method', type: 'select_one', options: ['Manual', 'Semi-automatic', 'Automated'], required: true },
    // ── Production ────────────────────────────────────────────────────────
    { section: 'Production', label: 'Production volume', type: 'number', unit: 'units/shift', required: true },
    { section: 'Production', label: 'Total cycle time', type: 'number', unit: 'secs', required: true },
    // ── Tester & traceability ─────────────────────────────────────────────
    { section: 'Tester & traceability', label: 'Tester make & model', type: 'text', required: false },
    { section: 'Tester & traceability', label: 'Tester quantity', type: 'number', unit: 'units', required: false },
    { section: 'Tester & traceability', label: 'DataLogging / Traceability', type: 'select_one', options: ['Not required', 'Required - destination TBD', 'Local CSV / HMI report', 'MES/SCADA upload', 'Customer API/database'], hint: 'Select where test results must be stored or transferred.', required: false },
    { section: 'Tester & traceability', label: 'Traceability data captured', type: 'select_many', options: ['Part serial / 2D code', 'Part number / variant', 'Leak value', 'Test pressure', 'OK/NG result', 'Date/time/operator', 'Station ID'], hint: 'Select the exact fields the tester must log for each cycle.', required: false },
    { section: 'Tester & traceability', label: 'Scanner make / model', type: 'text', hint: 'Customer-preferred barcode/2D scanner, if specified.', required: false },
    { section: 'Tester & traceability', label: 'Barcode scan point', type: 'select_one', options: ['Before test', 'After test', 'Before and after test', 'Manual entry only', 'Not required'], hint: 'Defines when the part ID is captured in the cycle.', required: false },
    { section: 'Tester & traceability', label: 'Barcode location on part', type: 'text', hint: 'Mark face/area, orientation, code type, scanner view, distance, and lighting constraints.', required: false },
    { section: 'Tester & traceability', label: 'OK part identification', type: 'select_many', options: ['Dot Punch', 'Barcode Marking', 'Laser Marking', 'Label Print', 'No physical marking'], hint: 'How OK parts are physically or digitally identified after the test.', required: false },
    // ── Controls & preferences ────────────────────────────────────────────
    { section: 'Controls & preferences', label: 'PLC / HMI make & model', type: 'text', required: false },
    { section: 'Controls & preferences', label: 'Pneumatics make', type: 'text', required: false },
    { section: 'Controls & preferences', label: 'Hydraulics make & model', type: 'text', hint: 'If applicable', required: false },
    // ── Installation ──────────────────────────────────────────────────────
    { section: 'Installation', label: 'Installation location', type: 'text', hint: 'Plant name and city', required: false },
    { section: 'Installation', label: 'Expected PO date', type: 'date', hint: 'Select expected purchase order date.', required: false },
    { section: 'Installation', label: 'Expected despatch date', type: 'date', hint: 'Select expected dispatch date.', required: false },
    { section: 'Installation', label: 'Expected installation date', type: 'date', hint: 'Select expected installation date.', required: false },
  ],

  'Wet Leak Test Machine': [
    // ── Component ──────────────────────────────────────────────────────────
    { section: 'Component', label: 'Component material', type: 'text', hint: 'e.g. Aluminium, Cast Iron, Steel', required: true },
    { section: 'Component', label: 'Component size (L×W×H mm)', type: 'text', hint: 'Overall envelope dimensions in mm', required: true },
    { section: 'Component', label: 'Number of variants', type: 'number', unit: 'variants', hint: 'Part variants to be tested', required: true },
    // ── Leak specification ─────────────────────────────────────────────────
    { section: 'Leak specification', label: 'Test circuits and pressures', type: 'circuit_table', hint: 'Circuit name and test pressure (Kg/sqcm) — up to 4 circuits', required: true },
    { section: 'Leak specification', label: 'Acceptable leak rate', type: 'number', unit: 'CCM', required: true },
    { section: 'Leak specification', label: 'Water tank depth', type: 'number', unit: 'mm', hint: 'Immersion depth for submerged test', required: true },
    { section: 'Leak specification', label: 'Drying method after test', type: 'select_one', options: ['Air blow', 'Hot-air dryer', 'Not required'], required: true },
    // ── Assembly stage ─────────────────────────────────────────────────────
    { section: 'Assembly stage', label: 'Child part sub-assembly present?', type: 'select_one', options: ['Yes', 'No'], required: true },
    { section: 'Assembly stage', label: 'Leak test timing', type: 'select_many', options: ['Before assembly', 'After assembly'], hint: 'Select when leak test is performed', required: false },
    // ── Machine configuration ──────────────────────────────────────────────
    { section: 'Machine configuration', label: 'Machine type', type: 'select_one', options: ['Standalone', 'Conveyor', 'Rotary Indexing'], required: true },
    { section: 'Machine configuration', label: 'Number of test stations', type: 'number', unit: 'stations', required: true },
    { section: 'Machine configuration', label: 'Component loading method', type: 'select_one', options: ['Manual', 'Semi-automatic', 'Automated'], required: true },
    { section: 'Machine configuration', label: 'Component unloading method', type: 'select_one', options: ['Manual', 'Semi-automatic', 'Automated'], required: true },
    // ── Production ─────────────────────────────────────────────────────────
    { section: 'Production', label: 'Production volume', type: 'number', unit: 'units/shift', required: true },
    { section: 'Production', label: 'Total cycle time', type: 'number', unit: 'secs', required: true },
    // ── Tester & traceability ─────────────────────────────────────────────
    { section: 'Tester & traceability', label: 'Tester make & model', type: 'text', required: false },
    { section: 'Tester & traceability', label: 'Tester quantity', type: 'number', unit: 'units', required: false },
    { section: 'Tester & traceability', label: 'DataLogging / Traceability', type: 'select_one', options: ['Not required', 'Required - destination TBD', 'Local CSV / HMI report', 'MES/SCADA upload', 'Customer API/database'], hint: 'Select where test results must be stored or transferred.', required: false },
    { section: 'Tester & traceability', label: 'Traceability data captured', type: 'select_many', options: ['Part serial / 2D code', 'Part number / variant', 'Leak value', 'Test pressure', 'OK/NG result', 'Date/time/operator', 'Station ID'], hint: 'Select the exact fields the tester must log for each cycle.', required: false },
    { section: 'Tester & traceability', label: 'Scanner make / model', type: 'text', hint: 'Customer-preferred barcode/2D scanner, if specified.', required: false },
    { section: 'Tester & traceability', label: 'Barcode scan point', type: 'select_one', options: ['Before test', 'After test', 'Before and after test', 'Manual entry only', 'Not required'], hint: 'Defines when the part ID is captured in the cycle.', required: false },
    { section: 'Tester & traceability', label: 'Barcode location on part', type: 'text', hint: 'Mark face/area, orientation, code type, scanner view, distance, and lighting constraints.', required: false },
    { section: 'Tester & traceability', label: 'OK part identification', type: 'select_many', options: ['Dot Punch', 'Barcode Marking', 'Laser Marking', 'Label Print', 'No physical marking'], hint: 'How OK parts are physically or digitally identified after the test.', required: false },
    // ── Controls & preferences ────────────────────────────────────────────
    { section: 'Controls & preferences', label: 'PLC / HMI make & model', type: 'text', required: false },
    { section: 'Controls & preferences', label: 'Pneumatics make', type: 'text', required: false },
    { section: 'Controls & preferences', label: 'Hydraulics make & model', type: 'text', hint: 'If applicable', required: false },
    // ── Installation ──────────────────────────────────────────────────────
    { section: 'Installation', label: 'Installation location', type: 'text', hint: 'Plant name and city', required: false },
    { section: 'Installation', label: 'Expected PO date', type: 'date', hint: 'Select expected purchase order date.', required: false },
    { section: 'Installation', label: 'Expected despatch date', type: 'date', hint: 'Select expected dispatch date.', required: false },
    { section: 'Installation', label: 'Expected installation date', type: 'date', hint: 'Select expected installation date.', required: false },
  ],

  // ── WASHING MACHINES ───────────────────────────────────────────────────────

  'Washing & Drying Machine': [
    { label: 'Component material, size, and variants', hint: 'Material, dimensions L×W×H in mm, weight, and number of variants to be washed.', required: true },
    { label: 'Contamination type', hint: 'Coolant, cutting oil, chips, dust, grinding paste, or other process fluids.', required: true },
    { label: 'Cleanliness target', hint: 'Particle size limit, gravimetric limit (mg), or cleanliness class (NAS / ISO / Merker).', required: true },
    { label: 'Wash and rinse stages', hint: 'Number of wash/rinse stages, spray pressure, temperature, detergent type, rust inhibitor requirement.', required: true },
    { label: 'Drying requirement', hint: 'Air blow, hot-air, or vacuum drying. Residual moisture limit. Temperature-sensitive considerations.', required: true },
    { label: 'Machine configuration and loading', hint: 'Rotary, tunnel, batch, or inline. Manual, conveyor, or robotic loading. Parts per basket or carrier.', required: true },
    { label: 'Production volume and cycle time', hint: 'Components per shift and target wash cycle time (secs or mins).', required: true },
    { label: 'PLC/HMI and utilities', hint: 'PLC/HMI make/model preference. Compressed air, water, and power utilities available at site.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  'Washing cum Drying Machine': [
    { label: 'Component material, size, and variants', hint: 'Material, dimensions L×W×H in mm, weight, and number of variants.', required: true },
    { label: 'Contamination type', hint: 'Coolant, cutting oil, chips, dust, or other process fluids.', required: true },
    { label: 'Cleanliness target', hint: 'Particle size limit, gravimetric limit (mg), or cleanliness class.', required: true },
    { label: 'Wash and rinse stages', hint: 'Wash and rinse stages, spray pressure, temperature, detergent, rust inhibitor.', required: true },
    { label: 'Drying requirement', hint: 'Air blow, hot-air, or vacuum drying. Residual moisture limit.', required: true },
    { label: 'Machine configuration and loading', hint: 'Compact combined unit — batch or rotary. Manual or auto loading. Footprint constraint?', required: true },
    { label: 'Production volume and cycle time', hint: 'Components per shift and target wash+dry cycle time.', required: true },
    { label: 'PLC/HMI and utilities', hint: 'PLC/HMI preference. Compressed air, water, and power available at site.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  'Conveyor Washing Machine': [
    { label: 'Component material, size, and variants', hint: 'Material, dimensions L×W×H in mm, weight, and number of variants.', required: true },
    { label: 'Contamination type and cleanliness target', hint: 'Oil, chips, coolant, etc. Required cleanliness class or particle limit.', required: true },
    { label: 'Conveyor configuration', hint: 'Conveyor speed, pitch, carrier/basket style, inline direction. Manual or automatic loading?', required: true },
    { label: 'Wash and rinse stages', hint: 'Number of wash/rinse zones, spray pressure, temperature, detergent, rust inhibitor.', required: true },
    { label: 'Drying requirement', hint: 'Air blow or hot-air drying zone. Residual moisture limit at conveyor exit.', required: true },
    { label: 'Production volume and line speed', hint: 'Parts per shift, required throughput (parts/hour), and takt time.', required: true },
    { label: 'PLC/HMI and utilities', hint: 'PLC/HMI preference. Air, water, power, and drain available at site.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  'Ultrasonic Washing Machine': [
    { label: 'Component material, size, and variants', hint: 'Material, dimensions L×W×H in mm, weight, and variants. Any cavities or blind holes?', required: true },
    { label: 'Contamination type and cleanliness target', hint: 'Fine contamination, metallic dust, machining oil, micro-chips. Required cleanliness class or NAS level.', required: true },
    { label: 'Ultrasonic parameters', hint: 'Preferred frequency (kHz), power density, tank volume, number of ultrasonic stages.', required: true },
    { label: 'Rinse and rust inhibitor stages', hint: 'Hot rinse, DI rinse, rust inhibitor dip. Temperature and time per stage.', required: true },
    { label: 'Drying requirement', hint: 'Hot-air, vacuum, or spin drying. Residual moisture target.', required: true },
    { label: 'Loading and production volume', hint: 'Batch or continuous. Manual or auto loading. Parts per batch, batches per shift.', required: true },
    { label: 'PLC/HMI and utilities', hint: 'PLC/HMI preference. DI water availability, ultrasonic power supply, compressed air.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  'Final Washing & Airbow Station': [
    { label: 'Component material, size, and variants', hint: 'Material, dimensions L×W×H in mm, weight, and number of variants.', required: true },
    { label: 'Contamination to be removed', hint: 'Residual coolant, dust, chips, or process fluids remaining before dispatch or assembly.', required: true },
    { label: 'Cleanliness target', hint: 'Particle limit, gravimetric, or visual standard required at station exit.', required: true },
    { label: 'Wash and air-blow stages', hint: 'Spray wash parameters, air-blow pressure, nozzle layout, blow duration.', required: true },
    { label: 'Loading, fixture, and cycle time', hint: 'Manual or auto loading. Fixture or free-standing. Target cycle time (secs).', required: true },
    { label: 'Production volume', hint: 'Components per shift.', required: true },
    { label: 'PLC/HMI and utilities', hint: 'PLC/HMI preference. Compressed air pressure and volume available at station.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  'Gear Housing Washing Machine': [
    { label: 'Gear housing material, size, and variants', hint: 'Material (Al/CI), overall L×W×H in mm, weight, number of housing variants.', required: true },
    { label: 'Internal passages and blind features', hint: 'Oil gallery count, bore depths, threaded ports — areas prone to chip retention.', required: true },
    { label: 'Contamination type and cleanliness target', hint: 'Machining oil, chips, coolant. Required cleanliness class for assembly.', required: true },
    { label: 'Wash stages and media', hint: 'Wash stages, spray pressure, temperature, detergent, rinse, rust inhibitor.', required: true },
    { label: 'Drying requirement', hint: 'Air blow or hot-air drying, blind-hole blow sequence, residual moisture limit.', required: true },
    { label: 'Loading method and production volume', hint: 'Manual or robotic loading. Parts per shift and cycle time target (secs).', required: true },
    { label: 'PLC/HMI and utilities', hint: 'PLC/HMI preference. Air, water, power, and drain layout.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  'Gear Housing Washing & Drying Machine': [
    { label: 'Gear housing material, size, and variants', hint: 'Material (Al/CI), overall L×W×H in mm, weight, number of variants.', required: true },
    { label: 'Internal passages and blind features', hint: 'Oil galleries, bore depths, threaded ports — chip-retention risk areas.', required: true },
    { label: 'Contamination type and cleanliness target', hint: 'Machining oil, chips, coolant. Required cleanliness class for assembly.', required: true },
    { label: 'Wash and rinse stages', hint: 'Stages, spray pressure, temperature, detergent, rust inhibitor.', required: true },
    { label: 'Drying requirement', hint: 'Hot-air drying with blind-hole blow sequence. Residual moisture limit.', required: true },
    { label: 'Loading method and production volume', hint: 'Manual or robotic loading. Parts per shift and cycle time target (secs).', required: true },
    { label: 'PLC/HMI and utilities', hint: 'PLC/HMI preference. Air, water, and power at site.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  'Adaptor Washing Machine': [
    { label: 'Adaptor material, size, and variants', hint: 'Material, dimensions L×W×H in mm, weight, and number of adaptor variants.', required: true },
    { label: 'Contamination type and cleanliness target', hint: 'Machining fluid, oil, chips. Required cleanliness level for assembly.', required: true },
    { label: 'Wash and rinse stages', hint: 'Wash stages, spray pressure, temperature, detergent, rinse, rust inhibitor.', required: true },
    { label: 'Drying requirement', hint: 'Air blow or hot-air drying. Residual moisture limit.', required: true },
    { label: 'Loading method and production volume', hint: 'Manual or auto loading. Parts per shift and cycle time target (secs).', required: true },
    { label: 'PLC/HMI and utilities', hint: 'PLC/HMI preference. Air, water, and power utilities available.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  'Washing & Rinsing Machine': [
    { label: 'Component material, size, and variants', hint: 'Material, dimensions L×W×H in mm, weight, and variants count.', required: true },
    { label: 'Contamination type and cleanliness target', hint: 'Process fluid, oil, particles. Required cleanliness class.', required: true },
    { label: 'Wash and rinse stage count', hint: 'Number of wash stages, rinse stages (hot/cold/DI). Temperature and pressure per stage.', required: true },
    { label: 'Rust inhibitor and final rinse', hint: 'Rust inhibitor concentration, DI water rinse, carryover control requirement.', required: true },
    { label: 'Loading method and production volume', hint: 'Manual, conveyor, or robotic loading. Parts per shift and cycle time.', required: true },
    { label: 'PLC/HMI and utilities', hint: 'PLC/HMI preference. Water quality, drain, air, and power available.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  '9S Planetary Washing Machine': [
    { label: 'Component material, size, and variants', hint: 'Material, dimensions L×W×H in mm, weight, and number of variants.', required: true },
    { label: 'Contamination type and cleanliness target', hint: 'Oil, chips, coolant. Required cleanliness class or particle limit.', required: true },
    { label: 'Wash stages across 9 stations', hint: 'Wash/rinse/dry assignment per station, spray parameters, detergent, rust inhibitor.', required: true },
    { label: 'Drying requirement', hint: 'Air blow, hot-air, or spin drying. Residual moisture limit.', required: true },
    { label: 'Production volume and cycle time', hint: 'Components per shift, required throughput, and indexing cycle time.', required: true },
    { label: 'PLC/HMI and utilities', hint: 'PLC/HMI preference. Air, water, and power available at site.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  // ── ASSEMBLY STATIONS ──────────────────────────────────────────────────────

  'Assembly Station': [
    { label: 'Product and component details', hint: 'What is being assembled? Part name, material, size, number of sub-components, and variants.', required: true },
    { label: 'Assembly sequence and step count', hint: 'Number of steps. Manual, semi-auto, or fully automated? Shared or dedicated station?', required: true },
    { label: 'Joining and fastening requirements', hint: 'Torque values, press-fit loads, snap-fit, adhesive, staking — per step.', required: true },
    { label: 'Poka-yoke and presence checks', hint: 'Part orientation sensors, presence detection, mistake-proofing per assembly step.', required: true },
    { label: 'In-station testing', hint: 'Gauge check, barcode scan, leak test, electrical test, or vision system required?', required: true },
    { label: 'Production volume and cycle time', hint: 'Units per shift and target station cycle time (secs).', required: true },
    { label: 'Traceability and data logging', hint: 'Barcode/RFID scan at station, result logging, MES/SCADA interface.', required: false },
    { label: 'PLC/HMI and utilities', hint: 'PLC/HMI make/model preference. Air, power, and network at station.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  'LOFH Assembly Station': [
    { label: 'LOFH product and component details', hint: 'LOFH part name, material, size, sub-components, and variants.', required: true },
    { label: 'Assembly sequence and guided process control', hint: 'Step-by-step sequence, guided operator instructions, error-proofing per step.', required: true },
    { label: 'Joining and fastening requirements', hint: 'Torque values, press-fit, snap-fit, adhesive per step.', required: true },
    { label: 'Poka-yoke and presence checks', hint: 'LOFH-specific orientation checks, presence sensors, mistake-proofing per step.', required: true },
    { label: 'In-station testing', hint: 'Functional test, gauge, leak, or scan required at this station?', required: true },
    { label: 'Production volume and cycle time', hint: 'Units per shift and target cycle time (secs).', required: true },
    { label: 'Traceability and data logging', hint: 'Barcode/RFID, result logging, MES interface.', required: false },
    { label: 'PLC/HMI and utilities', hint: 'PLC/HMI preference. Air, power, and network at station.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  'Housing Oil Cooler Assembly Machine': [
    { label: 'Oil cooler housing component details', hint: 'Housing material, size L×W×H in mm, weight, sub-components, and variants.', required: true },
    { label: 'Assembly sequence and step count', hint: 'Steps for the oil cooler housing sub-assembly. Manual or semi-auto?', required: true },
    { label: 'Sealing and joining requirements', hint: 'Gasket, O-ring fitting, torque fastening, press-fit — per assembly step.', required: true },
    { label: 'Poka-yoke and presence detection', hint: 'Sealing component presence, orientation sensors, missed-part checks.', required: true },
    { label: 'In-station leak or functional test', hint: 'Is a leak test or flow test integrated into this assembly machine?', required: true },
    { label: 'Production volume and cycle time', hint: 'Units per shift and target station cycle time (secs).', required: true },
    { label: 'Traceability and data logging', hint: 'Barcode scan, result logging, MES/SCADA interface.', required: false },
    { label: 'PLC/HMI and utilities', hint: 'PLC/HMI preference. Air, power, and utilities at station.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  'Support Fairing Assembly Machine': [
    { label: 'Support fairing component details', hint: 'Fairing structure material, dimensions, weight, sub-components, and variants.', required: true },
    { label: 'Assembly sequence and precision requirements', hint: 'Step count, datum scheme, positional tolerance for fairing assembly.', required: true },
    { label: 'Joining and fastening methods', hint: 'Riveting, bolting, bonding, snap-fit — torque or force values per joint.', required: true },
    { label: 'Poka-yoke and orientation checks', hint: 'Fairing orientation, part presence detection, assembly verification at each step.', required: true },
    { label: 'Production volume and cycle time', hint: 'Units per shift and target cycle time (secs).', required: true },
    { label: 'Traceability and data logging', hint: 'Barcode, result logging, MES interface.', required: false },
    { label: 'PLC/HMI and utilities', hint: 'PLC/HMI preference. Air and power at station.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  'ISX Gear Housing Assembly Station': [
    { label: 'ISX gear housing component details', hint: 'Material, size L×W×H in mm, weight, sub-components, and variants for ISX engine gear housing.', required: true },
    { label: 'Assembly sequence and step count', hint: 'Step-by-step assembly for ISX gear housing. Manual, semi-auto, or fully automated?', required: true },
    { label: 'Joining and fastening requirements', hint: 'Torque values, press-fit loads, gasket/seal fitting per assembly step.', required: true },
    { label: 'Poka-yoke and presence checks', hint: 'ISX-specific error-proofing, part orientation sensors, missed-component detection.', required: true },
    { label: 'In-station testing', hint: 'Leak test, functional check, or gauge verification integrated at this station?', required: true },
    { label: 'Production volume and cycle time', hint: 'Units per shift and target cycle time (secs).', required: true },
    { label: 'Traceability and data logging', hint: 'Barcode/RFID, result logging, MES interface.', required: false },
    { label: 'PLC/HMI and utilities', hint: 'PLC/HMI preference. Air, power, and network at station.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  // ── EOL / FUNCTIONAL TESTER ────────────────────────────────────────────────

  'EOL Tester': [
    { label: 'Product and assembly details', hint: 'Final assembly name, variants, key sub-systems being tested.', required: true },
    { label: 'Functional test parameters', hint: 'Functions tested: pressure, flow, electrical, speed, torque, temperature — with expected ranges.', required: true },
    { label: 'Pass/fail limits and test sequence', hint: 'Acceptance limits per parameter. Test sequence and duration. Manual operator steps involved.', required: true },
    { label: 'Reject handling and rework flow', hint: 'How failures are flagged, quarantined, and tracked. Rework and re-test procedure.', required: true },
    { label: 'Production volume and cycle time', hint: 'Units tested per shift and target test cycle time (secs).', required: true },
    { label: 'DataLogging and customer report format', hint: 'Barcode/serial number input, fields to log, report format, MES/SCADA/database output.', required: false },
    { label: 'PLC/HMI and test equipment preferences', hint: 'PLC/HMI make/model. Preferred test instruments, DAQ system, actuator makes.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  // ── DISPENSING STATION ─────────────────────────────────────────────────────

  'TCC Loctite Dispensing Station': [
    { label: 'TCC component and joint details', hint: 'Component name, material, joint surfaces where Loctite is applied, and number of variants.', required: true },
    { label: 'Adhesive specification', hint: 'Loctite grade/part number, required bead diameter, bead path length, dot volume (ml).', required: true },
    { label: 'Dispense path and tolerance', hint: 'Bead path geometry, positional tolerance, start/end point, dispense speed.', required: true },
    { label: 'Curing method and verification', hint: 'Cure time, UV or heat cure? Vision or weight check to verify dispense quality?', required: true },
    { label: 'Rework and reject handling', hint: 'Blocked nozzle detection, dispense failure response, rejected part flow.', required: true },
    { label: 'Production volume and cycle time', hint: 'Units per shift and target dispense cycle time (secs).', required: true },
    { label: 'PLC/HMI and dispenser preferences', hint: 'PLC/HMI preference. Preferred dispense system make/model, air pressure supply.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  // ── FOUNDRY MACHINES ───────────────────────────────────────────────────────

  'Core Shooting Machine': [
    { label: 'Core box and cavity details', hint: 'Core box size, number of cavities, vent locations, blow tube positions.', required: true },
    { label: 'Sand type, binder, and curing method', hint: 'Sand grade and mesh, binder/resin type, cold box gas or hot box curing, gassing time.', required: true },
    { label: 'Core geometry and ejection', hint: 'Core dimensions, weight, draft angles, ejector pin layout.', required: true },
    { label: 'Machine type and tooling changeover', hint: 'Single-station or multi-station? Manual or automatic tooling changeover?', required: true },
    { label: 'Production volume and cycle time', hint: 'Cores per shift and target shoot+cure cycle time (secs).', required: true },
    { label: 'PLC/HMI and utilities', hint: 'PLC/HMI preference. Compressed air, gas supply, and electrical power at site.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  'Raiser Cutting Machine': [
    { label: 'Casting material and riser geometry', hint: 'Alloy, casting weight, riser count per casting, riser diameter and height.', required: true },
    { label: 'Cut locations and stock allowance', hint: 'Cut map showing riser/gate positions, stock allowance left on casting, datum reference faces.', required: true },
    { label: 'Cutting method and tooling', hint: 'Band saw, abrasive wheel, robot cutting, or hydraulic break? Coolant or dry cut?', required: true },
    { label: 'Chip and dust management', hint: 'Chip collection method, dust extraction requirement, enclosure needed.', required: true },
    { label: 'Production volume and cycle time', hint: 'Castings per shift and target cut cycle time (secs).', required: true },
    { label: 'PLC/HMI and utilities', hint: 'PLC/HMI preference. Power, coolant, and extraction available at site.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  'Decoring Machine': [
    { label: 'Casting material and core details', hint: 'Alloy, casting weight, core volume, core material (sand type, binder).', required: true },
    { label: 'Core removal method and access points', hint: 'Vibratory, hydraulic punch, or thermal. Access points and casting support surfaces.', required: true },
    { label: 'Sand extraction and collection', hint: 'Loose sand volume per casting, containment hopper, conveyor, dust extraction.', required: true },
    { label: 'Fixture and clamping', hint: 'Fixture clamping method, datum scheme, changeover for multiple variants.', required: true },
    { label: 'Production volume and cycle time', hint: 'Castings per shift and target decoring cycle time (secs).', required: true },
    { label: 'PLC/HMI and utilities', hint: 'PLC/HMI preference. Power, hydraulics, and extraction at site.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  'Core Drilling Machine': [
    { label: 'Core/casting material and drilling details', hint: 'Material, casting weight, number of holes, hole diameter and depth.', required: true },
    { label: 'Drilling pattern and datum scheme', hint: 'Hole positions, pitch, tolerance, reference faces, GD&T requirements.', required: true },
    { label: 'Tooling and coolant', hint: 'Drill type and grade, tool life expectation, coolant type (wet or MQL).', required: true },
    { label: 'Chip evacuation', hint: 'Chip extraction method, swarf conveyor, coolant filtration requirement.', required: true },
    { label: 'Production volume and cycle time', hint: 'Parts per shift and target drill cycle time (secs).', required: true },
    { label: 'PLC/HMI and utilities', hint: 'PLC/HMI preference. Coolant supply, chip handling, and power at site.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  'Gravity Die Cast Machine': [
    { label: 'Alloy and casting details', hint: 'Alloy grade, pour temperature, casting weight, and key dimensions.', required: true },
    { label: 'Die size, tilt, and clamp requirement', hint: 'Die weight and footprint, tilt angle range, clamp force, number of cavities.', required: true },
    { label: 'Cooling and solidification sequence', hint: 'Cooling circuits on die, air or water cooling, solidification time, casting extraction timing.', required: true },
    { label: 'Casting handling after extraction', hint: 'Unloading method (manual/robot), quench, inspection, trim station.', required: true },
    { label: 'Production volume and cycle time', hint: 'Castings per shift and target full die cycle time (secs).', required: true },
    { label: 'PLC/HMI and utilities', hint: 'PLC/HMI preference. Power, cooling water, hydraulics, and extraction at site.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  'Jet Cooling Closed Loop System': [
    { label: 'Die or tooling details', hint: 'Die material, size, number of cooling zones, and critical temperature zones.', required: true },
    { label: 'Cooling flow rate and pressure', hint: 'Required flow rate (LPM) and pressure (bar) per zone, total zones, target die temperature.', required: true },
    { label: 'Closed-loop water quality', hint: 'Water treatment, filtration, conductivity limits, inhibitor dosing, maintenance access.', required: true },
    { label: 'Temperature control and monitoring', hint: 'Target die surface temperature, sensor placement, controller make/model preference.', required: true },
    { label: 'Number of machines served and cycle tie-in', hint: 'Number of die cast machines connected, cycle integration, interlock signals.', required: true },
    { label: 'PLC/HMI and utilities', hint: 'PLC/HMI preference. Cooling water supply, power, and drain at site.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  'Jet Cooling Open Loop System': [
    { label: 'Die or tooling details', hint: 'Die material, size, number of cooling zones, and critical temperature areas.', required: true },
    { label: 'Cooling flow rate and pressure', hint: 'Required flow rate (LPM) and pressure (bar) per zone, total cooling zones.', required: true },
    { label: 'Water supply and drainage', hint: 'Inlet water quality and supply pressure, drainage provision, scaling risk.', required: true },
    { label: 'Temperature control and monitoring', hint: 'Target die temperature, sensor placement, controller preference.', required: true },
    { label: 'Number of machines served and cycle tie-in', hint: 'Machines connected, cycle integration, interlock signals.', required: true },
    { label: 'PLC/HMI and utilities', hint: 'PLC/HMI preference. Water supply, power, and drain at site.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  'High Pressure Cooling Machine': [
    { label: 'Component or die details', hint: 'What is being cooled — die zones, part, or tooling? Dimensions and critical zones.', required: true },
    { label: 'Required pressure and flow', hint: 'Coolant pressure (bar), flow rate (LPM), number of high-pressure circuits.', required: true },
    { label: 'Coolant type and filtration', hint: 'Water, emulsion, or synthetic coolant. Filtration requirement and debris tolerance.', required: true },
    { label: 'Temperature control targets', hint: 'Inlet and outlet temperature targets, allowable temperature rise.', required: true },
    { label: 'Production cycle integration', hint: 'Standalone unit or integrated with machine cycle. Interlock signals required.', required: true },
    { label: 'PLC/HMI and utilities', hint: 'PLC/HMI preference. Coolant supply, high-pressure plumbing, and power at site.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  'Pump Cooling Machine': [
    { label: 'Component or tooling details', hint: 'What is being cooled — die, mould, or machine tooling? Size and zones.', required: true },
    { label: 'Pump flow rate and pressure', hint: 'Required flow rate (LPM), delivery pressure (bar), number of cooling circuits.', required: true },
    { label: 'Coolant type and maintenance', hint: 'Coolant type, filter maintenance interval, reservoir volume, top-up procedure.', required: true },
    { label: 'Temperature control', hint: 'Target coolant temperature, chiller requirement, monitoring points.', required: true },
    { label: 'Production integration', hint: 'Standalone or inline with production cycle. Interlock signals required.', required: true },
    { label: 'PLC/HMI and utilities', hint: 'PLC/HMI preference. Power and coolant supply at site.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  // ── SPM ────────────────────────────────────────────────────────────────────

  '2 Ton Press': [
    { label: 'Component and press-fit details', hint: 'Parts being pressed, material, interference fit dimensions, and variants.', required: true },
    { label: 'Required press force and stroke', hint: 'Peak press force (tons/kN), working stroke (mm), press speed, dwell time.', required: true },
    { label: 'Tooling and die interface', hint: 'Punch and die details, guide pillars, tool changeover method, locating datum.', required: true },
    { label: 'Force monitoring and acceptance window', hint: 'Force-distance curve, peak force window, step force limits, reject logic.', required: true },
    { label: 'Operator loading and safety guarding', hint: 'Manual or auto load, two-hand control, light curtain, door interlock requirement.', required: true },
    { label: 'Production volume and cycle time', hint: 'Parts per shift and target press cycle time (secs).', required: true },
    { label: 'PLC/HMI and traceability', hint: 'PLC/HMI preference. Force-result logging, barcode input, MES interface.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  '180 Ton Press': [
    { label: 'Component and press-fit details', hint: 'Parts being pressed, material, interference fit dimensions, and sub-assembly details.', required: true },
    { label: 'Required press force, stroke, and daylight', hint: 'Peak press force (tons/kN), working stroke (mm), daylight, bed size.', required: true },
    { label: 'Foundation and anchoring requirement', hint: 'Pit requirement, base plate, anchor bolt layout, floor load capacity.', required: true },
    { label: 'Tooling and die interface', hint: 'Punch and die size, guide arrangement, changeover time requirement.', required: true },
    { label: 'Force monitoring and acceptance window', hint: 'Force-distance curve, peak and step limits, reject logic.', required: true },
    { label: 'Operator loading and safety guarding', hint: 'Manual or auto load, two-hand control, safety fence, interlock requirement.', required: true },
    { label: 'Production volume and cycle time', hint: 'Parts per shift and target press cycle time (secs).', required: true },
    { label: 'PLC/HMI and traceability', hint: 'PLC/HMI preference. Force-result logging, barcode input, MES interface.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  'Auto Loader': [
    { label: 'Part details and feed format', hint: 'Part name, material, dimensions, weight, and how parts arrive (tray, bowl, conveyor, stack).', required: true },
    { label: 'Orientation and part presentation', hint: 'Required orientation at machine interface. Vision or mechanical orientation method.', required: true },
    { label: 'Buffer size and throughput', hint: 'Required buffer (number of parts), feed rate (parts/min), and machine integration speed.', required: true },
    { label: 'Jam recovery and fault handling', hint: 'Jam detection method, manual clear access, bypass mode, alarm signals.', required: true },
    { label: 'Machine integration and handshake signals', hint: 'Interface with press or SPM, handshake protocol, safety interlock.', required: true },
    { label: 'Production volume and cycle time', hint: 'Parts per shift and required loader cycle time (secs per part).', required: true },
    { label: 'PLC/HMI and utilities', hint: 'PLC/HMI preference. Power and compressed air at site.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date, despatch date, and installation date.', required: false },
  ],

  // ── FABRICATION ─────────────────────────────────────────────────────────────

  'Pallet Lifter': [
    { label: 'Pallet size and load details', hint: 'Pallet footprint (L×W mm), max working load (kg), load centre of gravity.', required: true },
    { label: 'Lift height and transfer direction', hint: 'Required lift stroke (mm), infeed and outfeed direction, floor level or raised start.', required: true },
    { label: 'Safety and stability requirements', hint: 'Tipping risk, load locking mechanism, guarding around lifter, emergency lowering.', required: true },
    { label: 'Material, finish, and load rating', hint: 'MS or SS structure, paint or powder coat. Working load, dynamic load, required safety factor.', required: true },
    { label: 'Installation location and project timeline', hint: 'Plant/city, floor type (concrete/steel), expected PO date, despatch and installation date.', required: false },
  ],

  'Tool Rack': [
    { label: 'Tool count, size, and weight', hint: 'Number of tools, largest tool dimensions, heaviest tool weight, total load estimate.', required: true },
    { label: 'Storage layout and format', hint: 'Shadow board, drawer, hanging, or shelf format. Growth allowance required.', required: true },
    { label: 'Identification and retrieval system', hint: 'RFID, barcode, colour-coded, or labelled shadow board. Tool return detection?', required: true },
    { label: 'Material, finish, and mounting method', hint: 'MS or SS, paint/powder coat. Wall-mounted, floor-standing, or machine-side.', required: true },
    { label: 'Workstation placement and space constraints', hint: 'Position relative to machine. Aisle clearance, overhead obstructions.', required: false },
    { label: 'Installation location and project timeline', hint: 'Plant/city, expected PO date and delivery date.', required: false },
  ],
};

export function getMachineChecklist(
  verticalId?: string | null,
  machineName?: string | null,
): MacproChecklistItem[] {
  const vertical = getVerticalById(verticalId);
  if (!vertical || !machineName) return [];

  // If a machine-specific override exists, return it exclusively —
  // it already covers all RFQ fields, no stacking needed.
  const override = MACHINE_CHECKLIST_OVERRIDES[machineName];
  if (override?.length) return override;

  // Fallback for machines not yet in the override table.
  const items = [
    ...VERTICAL_CHECKLIST[vertical.id],
    ...BASE_MACHINE_CHECKLIST,
  ];

  return items.filter(
    (item, index) => items.findIndex((c) => c.label === item.label) === index,
  );
}
