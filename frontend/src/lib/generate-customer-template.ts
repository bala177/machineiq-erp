import * as XLSX from 'xlsx';

const HEADERS = [
  'name',
  'account type',
  'company size',
  'industry',
  'website',
  'contact person',
  'email',
  'phone',
  'secondary contact name',
  'secondary contact email',
  'secondary contact phone',
  'address',
  'city',
  'state/province',
  'postal code',
  'country',
  'vat number',
  'registration number',
  'payment terms',
  'notes',
];

const SAMPLE_ROWS = [
  [
    'Acme Automation GmbH', 'active', '201-1000', 'Industrial Automation',
    'https://acmeautomation.de', 'Klaus Weber', 'k.weber@acmeautomation.de', '+49 30 12345678',
    'Sabine Müller', 's.mueller@acmeautomation.de', '+49 30 87654321',
    'Berliner Str. 42', 'Berlin', 'Berlin', '10115', 'Germany',
    'DE123456789', 'HRB 12345', 'Net 30', 'Key OEM partner for conveyor systems',
  ],
  [
    'Nordic CNC Solutions', 'prospect', '11-50', 'CNC Manufacturing',
    '', 'Lars Eriksson', 'l.eriksson@nordiccnc.se', '+46 8 123 456 78',
    '', '', '',
    'Verkstadsgatan 8', 'Gothenburg', 'Västra Götaland', '41258', 'Sweden',
    '', '', 'Net 60', 'Evaluating our platform for new production line',
  ],
  [
    'TechForge Industries', 'active', '1001+', 'Heavy Machinery',
    'https://techforge.com', 'Maria Santos', 'm.santos@techforge.com', '+1 313 555 0199',
    'David Kim', 'd.kim@techforge.com', '+1 313 555 0200',
    '1000 Industrial Blvd', 'Detroit', 'Michigan', '48201', 'United States',
    '', '', 'Net 30', 'Multi-site customer — coordinate with regional PMs before quoting',
  ],
];

const FIELD_GUIDE = [
  ['Column',                   'Required', 'Allowed Values / Notes'],
  ['name',                     'YES',      'Company name — must be unique'],
  ['account type',             'no',       'prospect · active · inactive · churned  (default: prospect)'],
  ['company size',             'no',       '1-10 · 11-50 · 51-200 · 201-1000 · 1001+'],
  ['industry',                 'no',       'Free text, e.g. "Industrial Automation"'],
  ['website',                  'no',       'Full URL, e.g. https://example.com'],
  ['contact person',           'no',       'Primary contact full name'],
  ['email',                    'no',       'Primary contact email address'],
  ['phone',                    'no',       'Primary contact phone (any format)'],
  ['secondary contact name',   'no',       'Secondary contact full name'],
  ['secondary contact email',  'no',       'Secondary contact email address'],
  ['secondary contact phone',  'no',       'Secondary contact phone'],
  ['address',                  'no',       'Street address line'],
  ['city',                     'no',       'City name'],
  ['state/province',           'no',       'State, province, or region'],
  ['postal code',              'no',       'ZIP or postal code'],
  ['country',                  'no',       'Country name, e.g. Germany, United States'],
  ['vat number',               'no',       'VAT / tax ID, e.g. DE123456789'],
  ['registration number',      'no',       'Company registration number'],
  ['payment terms',            'no',       'e.g. Net 30, Net 45, Net 60'],
  ['notes',                    'no',       'Free text notes — visible to the team'],
  [],
  ['Notes', '', ''],
  ['• The first row must be the header row exactly as shown above.', '', ''],
  ['• Column order does not matter as long as headers match.', '', ''],
  ['• Rows with a blank "name" column are skipped on import.', '', ''],
  ['• Duplicate company names are skipped (not overwritten).', '', ''],
  ['• Invalid account type or company size values are silently cleared.', '', ''],
];

export function generateCustomerTemplate() {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Template ──────────────────────────────────────────────────────
  const templateData: (string | number)[][] = [
    HEADERS,
    ...SAMPLE_ROWS,
    // 10 blank rows ready to fill
    ...Array.from({ length: 10 }, () => Array(HEADERS.length).fill('')),
  ];

  const ws = XLSX.utils.aoa_to_sheet(templateData);

  // Column widths
  ws['!cols'] = [
    { wch: 28 }, // name
    { wch: 14 }, // account type
    { wch: 13 }, // company size
    { wch: 22 }, // industry
    { wch: 28 }, // website
    { wch: 22 }, // contact person
    { wch: 30 }, // email
    { wch: 18 }, // phone
    { wch: 22 }, // secondary contact name
    { wch: 30 }, // secondary contact email
    { wch: 18 }, // secondary contact phone
    { wch: 24 }, // address
    { wch: 16 }, // city
    { wch: 18 }, // state/province
    { wch: 12 }, // postal code
    { wch: 18 }, // country
    { wch: 16 }, // vat number
    { wch: 20 }, // registration number
    { wch: 14 }, // payment terms
    { wch: 36 }, // notes
  ];

  // Style header row bold + light fill
  HEADERS.forEach((_, c) => {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c });
    if (!ws[cellAddr]) return;
    ws[cellAddr].s = {
      font: { bold: true, color: { rgb: '1E3A5F' } },
      fill: { fgColor: { rgb: 'D6E4F0' } },
      alignment: { horizontal: 'center' },
      border: {
        bottom: { style: 'thin', color: { rgb: '1E3A5F' } },
      },
    };
  });

  // Freeze first row
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft' };

  XLSX.utils.book_append_sheet(wb, ws, 'Template');

  // ── Sheet 2: Field Guide ───────────────────────────────────────────────────
  const guideWs = XLSX.utils.aoa_to_sheet(FIELD_GUIDE);

  guideWs['!cols'] = [{ wch: 26 }, { wch: 10 }, { wch: 60 }];

  // Bold the header row of the guide
  ['A1', 'B1', 'C1'].forEach((addr) => {
    if (!guideWs[addr]) return;
    guideWs[addr].s = {
      font: { bold: true, color: { rgb: '1E3A5F' } },
      fill: { fgColor: { rgb: 'D6E4F0' } },
    };
  });

  XLSX.utils.book_append_sheet(wb, guideWs, 'Field Guide');

  // ── Download ───────────────────────────────────────────────────────────────
  XLSX.writeFile(wb, 'customers_template.xlsx');
}
