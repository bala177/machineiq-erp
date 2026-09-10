/**
 * Plain-language explanations for the statutory and trade terms the app asks
 * people to fill in. One definition per term, used everywhere the term appears,
 * so a person meets the same wording on the customer form and the company
 * profile.
 */
export type GlossaryEntry = {
  /** What the abbreviation stands for. */
  full: string;
  /** One or two sentences a non-specialist can act on. */
  description: string;
  /** A real example of the identifier, shown in monospace. */
  format?: string;
  /** Who issues it, when that helps someone find the number. */
  issuedBy?: string;
};

export const glossary = {
  masterData: {
    full: 'Master data',
    description: 'Shared records such as customers, suppliers, employees, warehouses, items, currencies and tax rates. Transactions select these records instead of copying or retyping them.',
  },
  foundationMaster: {
    full: 'Foundation master',
    description: 'An R1 reference needed by later work. In MachineIQ this includes employees, warehouses, currencies, tax rates and configurable statuses.',
  },
  enquiry: {
    full: 'Customer enquiry',
    description: 'The first controlled sales record for a customer request. It captures the machine need, site, quantity, target date and technical requirement summary before quotation.',
  },
  quotationRevision: {
    full: 'Quotation revision',
    description: 'A new controlled version of a quotation. Earlier approved versions stay visible so users can compare what changed and preserve the customer decision history.',
  },
  salesOrder: {
    full: 'Sales order',
    description: 'The internal record of the accepted customer commitment. It is created from an accepted quotation and retains the customer PO, scope, value, dates and milestones.',
  },
  paymentMilestone: {
    full: 'Payment milestone',
    description: 'A contractual amount due when an agreed event occurs, such as order confirmation, FAT approval or dispatch. It is not itself an invoice or payment receipt.',
  },
  machineProject: {
    full: 'Machine project',
    description: 'The execution record created from a confirmed sales order. It connects the commercial promise to engineering and later delivery work.',
  },
  commercialBaseline: {
    full: 'Commercial baseline',
    description: 'The protected snapshot of the approved order used to start a machine project. Later changes are recorded explicitly instead of overwriting this starting truth.',
  },
  uom: {
    full: 'Unit of measure (UOM)',
    description: 'The controlled unit used to quantify an item, such as number, metre, kilogram or hour. Converted units reference a base UOM and conversion factor.',
  },
  documentType: {
    full: 'Document type',
    description: 'A numbering definition that controls a business record prefix and sequence behavior. Sales documents use their dedicated Sales settings.',
  },
  referenceStatus: {
    full: 'Reference status',
    description: 'A reusable status label and order configured for a module, including whether the status is terminal. It avoids embedding every display label in code.',
  },
  permission: {
    full: 'Permission',
    description: 'A server-enforced capability assigned to a role. A role name alone does not grant an operation unless the required permission is assigned.',
  },
  role: {
    full: 'Role',
    description: 'A named collection of permissions assigned to users, such as Sales or Approver. Custom roles can be created without changing application code.',
  },
  activeRecord: {
    full: 'Active / inactive record',
    description: 'An active master can be selected in new work. An inactive master stays in history but cannot be used for a new transaction.',
  },
  auditTrail: {
    full: 'Audit trail',
    description: 'The retained record of who changed or approved something, what action occurred and when it happened.',
  },
  softDelete: {
    full: 'Deactivate / soft delete',
    description: 'Removes a record from normal selection without erasing it from existing documents or audit history.',
  },
  numberingSeries: {
    full: 'Numbering series',
    description: 'The prefix and sequential counter used to generate unique business references. A generated number is never silently reused.',
  },
  customerSite: {
    full: 'Customer site',
    description: 'The customer location where the machine will operate or be delivered. It is selected separately from the customer billing identity.',
  },
  qualification: {
    full: 'Enquiry qualification',
    description: 'The decision that an enquiry is sufficiently understood and worth progressing into a controlled quotation.',
  },
  quotation: {
    full: 'Technical-commercial quotation',
    description: 'The controlled offer combining technical scope and exclusions with price, tax, delivery, warranty, validity, terms and payment milestones.',
  },
  approver: {
    full: 'Approver',
    description: 'An authorized user who reviews submitted work and either approves it or returns it with a reason. Separation rules can prevent self-approval.',
  },
  customerAcceptance: {
    full: 'Customer acceptance',
    description: 'Recorded evidence that the customer accepted the approved quotation. It is separate from internal approval and is required before order conversion.',
  },
  projectIntake: {
    full: 'Project intake',
    description: 'The controlled creation of a machine project from an approved sales order, including ownership, dates and the source baseline.',
  },
  machine: {
    full: 'Machine',
    description: 'The customer deliverable being engineered and built. A project may contain one or more machines with their own structure and work.',
  },
  module: {
    full: 'Module',
    description: 'A functional subdivision of a machine used to organize engineering work, components, deliverables and readiness.',
  },
  component: {
    full: 'Component',
    description: 'A part, assembly or service needed by a machine or module. It can reference the shared item master and later supply-chain status.',
  },
  deliverable: {
    full: 'Engineering deliverable',
    description: 'A required engineering output, such as a drawing, calculation, specification, program or review record.',
  },
  controlledDocument: {
    full: 'Controlled document',
    description: 'An engineering or business file whose revision, review, approval and release state are retained rather than overwritten.',
  },
  engineeringRevision: {
    full: 'Engineering revision',
    description: 'An identified version of a controlled engineering output. A new revision preserves the previous released content and its approval evidence.',
  },
  engineeringRelease: {
    full: 'Engineering release',
    description: 'Formal confirmation that approved engineering output is ready for downstream BOM, procurement or production use.',
  },
  decision: {
    full: 'Decision record',
    description: 'A documented technical or project choice with its owner, rationale, outcome and related work.',
  },
  task: {
    full: 'Task',
    description: 'An assigned unit of work with an owner, due date, priority and status, linked to the relevant project or engineering structure.',
  },
  blocker: {
    full: 'Blocker',
    description: 'An issue or dependency that prevents work from progressing. It should identify what is blocked and who must resolve it.',
  },
  longLeadItem: {
    full: 'Long-lead item',
    description: 'An item whose sourcing or manufacture may take long enough to threaten the project schedule and therefore needs early attention.',
  },
  bom: {
    full: 'Bill of materials (BOM)',
    description: 'The controlled list of components and quantities required to build a machine, assembly or module.',
  },
  makeBuy: {
    full: 'Make / buy',
    description: 'The sourcing decision that an item will be manufactured internally or purchased from a supplier.',
  },
  reorderLevel: {
    full: 'Reorder level',
    description: 'The stock threshold below which replenishment should be considered. It does not itself create a purchase order.',
  },
  procurement: {
    full: 'Procurement',
    description: 'The process of sourcing required items or services, comparing suppliers, placing orders and receiving the supply.',
  },
  purchaseRequest: {
    full: 'Purchase request (PR)',
    description: 'An internal request to obtain an item or service. Approval authorizes purchasing work but is not a supplier order.',
  },
  rfq: {
    full: 'Request for quotation (RFQ)',
    description: 'A request sent to one or more suppliers for price, delivery and commercial terms for defined requirements.',
  },
  purchaseOrder: {
    full: 'Purchase order (PO)',
    description: 'The approved commercial order issued to a supplier for specified items or services, quantities, prices and delivery terms.',
  },
  grn: {
    full: 'Goods receipt note (GRN)',
    description: 'The controlled record that ordered material was physically received, including accepted, rejected or pending quantities.',
  },
  warehouse: {
    full: 'Warehouse',
    description: 'A controlled storage location anchored to a physical company location. Stock zones, bins and movements extend it in the inventory release.',
  },
  stockTransfer: {
    full: 'Stock transfer',
    description: 'A traceable movement of material between warehouses, zones or bins without treating it as a purchase or sale.',
  },
  stockAdjustment: {
    full: 'Stock adjustment',
    description: 'An authorized correction to recorded stock with a reason and audit history, rather than an unexplained balance edit.',
  },
  cycleCount: {
    full: 'Cycle count',
    description: 'A scheduled physical count of selected stock used to compare and reconcile system quantities without a full shutdown.',
  },
  workOrder: {
    full: 'Work order',
    description: 'The authorized production record to manufacture an item or assembly using a defined quantity, routing and material requirement.',
  },
  routing: {
    full: 'Production routing',
    description: 'The ordered operations, work centers and expected times used to manufacture an item or assembly.',
  },
  workCenter: {
    full: 'Work center',
    description: 'A production resource or group of resources where a manufacturing operation is performed.',
  },
  ncr: {
    full: 'Non-conformance report (NCR)',
    description: 'A controlled quality record for a result that does not meet requirements, including disposition and corrective action.',
  },
  fat: {
    full: 'Factory acceptance test (FAT)',
    description: 'The formal verification that a machine meets agreed requirements before dispatch, with results, observations and acceptance evidence.',
  },
  invoice: {
    full: 'Invoice',
    description: 'A financial document requesting payment for supplied goods, services or a contractual milestone. It is distinct from the payment receipt.',
  },
  generalLedger: {
    full: 'General ledger (GL)',
    description: 'The accounting system of record that groups balanced debit and credit postings into controlled accounts and periods.',
  },
  costCenter: {
    full: 'Cost center',
    description: 'An accounting dimension used to group costs by department, function or responsibility area.',
  },
  fiscalYear: {
    full: 'Fiscal year',
    description: 'The organization-defined accounting year used for financial periods, numbering and reporting.',
  },
  employeeIdentity: {
    full: 'Employee identity',
    description: 'The workforce record for a person, independent from whether that person has a MachineIQ login account.',
  },
  attendance: {
    full: 'Attendance',
    description: 'The retained record of an employee’s presence, absence or working time for an applicable workday or shift.',
  },
  gstin: {
    full: 'Goods and Services Tax Identification Number',
    description: 'The 15-character number issued to every business registered under GST in India. It appears on your GST registration certificate and must be printed on tax invoices.',
    format: '29AABCM1234F1Z5',
    issuedBy: 'GST Network',
  },
  pan: {
    full: 'Permanent Account Number',
    description: 'The 10-character income-tax identifier held by the company. The first five letters, four digits, and a final check letter never change.',
    format: 'AABCM1234F',
    issuedBy: 'Income Tax Department',
  },
  panPersonal: {
    full: 'Permanent Account Number',
    description: "The director's personal income-tax identifier. Kept as a scanned copy for statutory filings and bank mandates.",
    format: 'AABPM1234F',
    issuedBy: 'Income Tax Department',
  },
  tan: {
    full: 'Tax Deduction and Collection Account Number',
    description: 'Required by anyone who deducts tax at source. You quote it on every TDS return and challan — it is separate from your PAN.',
    format: 'BLRM12345F',
    issuedBy: 'Income Tax Department',
  },
  cin: {
    full: 'Corporate Identity Number',
    description: 'The 21-character number assigned when the company was incorporated. It encodes the listing status, industry, state, year, and company type.',
    format: 'U29299KA2026PTC000001',
    issuedBy: 'Registrar of Companies',
  },
  din: {
    full: 'Director Identification Number',
    description: 'An 8-digit number held by each company director. A person keeps the same DIN for life, across every company they serve.',
    format: '02451188',
    issuedBy: 'Ministry of Corporate Affairs',
  },
  msme: {
    full: 'Udyam Registration Number',
    description: 'Identifies a Micro, Small or Medium Enterprise. Registration unlocks priority-sector lending and protection under delayed-payment rules. It replaced the older UAM numbers in 2020.',
    format: 'UDYAM-KA-03-0001234',
    issuedBy: 'Ministry of MSME',
  },
  moa: {
    full: 'Memorandum of Association',
    description: 'The charter filed at incorporation. It states why the company exists and the limits of what it may do.',
    issuedBy: 'Filed with the Registrar of Companies',
  },
  aoa: {
    full: 'Articles of Association',
    description: 'The internal rulebook — how directors are appointed, how shares move, and how decisions get made.',
    issuedBy: 'Filed with the Registrar of Companies',
  },
  aadhaar: {
    full: 'Aadhaar',
    description: 'The 12-digit identity number issued by UIDAI. Only the scanned copy is stored here — machineIQ deliberately does not keep the number itself.',
    issuedBy: 'UIDAI',
  },
  shareholding: {
    full: 'Shareholding',
    description: "The percentage of the company's shares this director holds. The board total is shown so the split can be checked at a glance.",
  },
  hsn: {
    full: 'Harmonised System of Nomenclature',
    description: 'The code that classifies a physical product on GST documents. It determines the tax rate applied to the line.',
    format: '850440',
  },
  sac: {
    full: 'Services Accounting Code',
    description: 'The HSN equivalent for services. It classifies the service on GST documents and sets its tax rate.',
    format: '998719',
  },
  taxRegistration: {
    full: 'Tax registration number',
    description: 'The tax identifier for this party in its own jurisdiction — a GSTIN in India, a VAT number in the EU and UK, or the local equivalent elsewhere.',
    format: '29AABCM1234F1Z5',
  },
} satisfies Record<string, GlossaryEntry>;

export type GlossaryTerm = keyof typeof glossary;
