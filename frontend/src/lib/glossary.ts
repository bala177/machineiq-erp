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
