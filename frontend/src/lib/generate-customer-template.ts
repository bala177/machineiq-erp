import { Workbook, Worksheet } from 'exceljs';

const HEADERS = [
  'name', 'account type', 'company size', 'industry', 'website', 'contact person', 'email', 'phone',
  'secondary contact name', 'secondary contact email', 'secondary contact phone', 'address', 'city',
  'state/province', 'postal code', 'country', 'vat number', 'registration number', 'payment terms', 'notes',
];

const SAMPLE_ROWS = [
  ['Acme Automation GmbH', 'active', '201-1000', 'Industrial Automation', 'https://acmeautomation.de', 'Klaus Weber', 'k.weber@acmeautomation.de', '+49 30 12345678', 'Sabine Müller', 's.mueller@acmeautomation.de', '+49 30 87654321', 'Berliner Str. 42', 'Berlin', 'Berlin', '10115', 'Germany', 'DE123456789', 'HRB 12345', 'Net 30', 'Key OEM partner for conveyor systems'],
  ['Nordic CNC Solutions', 'prospect', '11-50', 'CNC Manufacturing', '', 'Lars Eriksson', 'l.eriksson@nordiccnc.se', '+46 8 123 456 78', '', '', '', 'Verkstadsgatan 8', 'Gothenburg', 'Västra Götaland', '41258', 'Sweden', '', '', 'Net 60', 'Evaluating our platform for new production line'],
  ['TechForge Industries', 'active', '1001+', 'Heavy Machinery', 'https://techforge.com', 'Maria Santos', 'm.santos@techforge.com', '+1 313 555 0199', 'David Kim', 'd.kim@techforge.com', '+1 313 555 0200', '1000 Industrial Blvd', 'Detroit', 'Michigan', '48201', 'United States', '', '', 'Net 30', 'Multi-site customer — coordinate with regional PMs before quoting'],
];

const FIELD_GUIDE = [
  ['Column', 'Required', 'Allowed Values / Notes'],
  ['name', 'YES', 'Company name — must be unique'],
  ['account type', 'no', 'prospect · active · inactive · churned  (default: prospect)'],
  ['company size', 'no', '1-10 · 11-50 · 51-200 · 201-1000 · 1001+'],
  ['industry', 'no', 'Free text, e.g. "Industrial Automation"'],
  ['website', 'no', 'Full URL, e.g. https://example.com'],
  ['contact person', 'no', 'Primary contact full name'],
  ['email', 'no', 'Primary contact email address'],
  ['phone', 'no', 'Primary contact phone (any format)'],
  ['secondary contact name', 'no', 'Secondary contact full name'],
  ['secondary contact email', 'no', 'Secondary contact email address'],
  ['secondary contact phone', 'no', 'Secondary contact phone'],
  ['address', 'no', 'Street address line'],
  ['city', 'no', 'City name'],
  ['state/province', 'no', 'State, province, or region'],
  ['postal code', 'no', 'ZIP or postal code'],
  ['country', 'no', 'Country name, e.g. Germany, United States'],
  ['vat number', 'no', 'VAT / tax ID, e.g. DE123456789'],
  ['registration number', 'no', 'Company registration number'],
  ['payment terms', 'no', 'e.g. Net 30, Net 45, Net 60'],
  ['notes', 'no', 'Free text notes — visible to the team'],
  [],
  ['Notes', '', ''],
  ['• The first row must be the header row exactly as shown above.', '', ''],
  ['• Column order does not matter as long as headers match.', '', ''],
  ['• Rows with a blank "name" column are skipped on import.', '', ''],
  ['• Duplicate company names are skipped (not overwritten).', '', ''],
  ['• Invalid account type or company size values are silently cleared.', '', ''],
];

function styleHeader(worksheet: Worksheet) {
  const row = worksheet.getRow(1);
  row.font = { bold: true, color: { argb: 'FF1E3A5F' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } };
  row.alignment = { horizontal: 'center' };
  row.eachCell((cell) => { cell.border = { bottom: { style: 'thin', color: { argb: 'FF1E3A5F' } } }; });
}

export async function generateCustomerTemplate() {
  const workbook = new Workbook();
  const template = workbook.addWorksheet('Template', { views: [{ state: 'frozen', ySplit: 1 }] });
  template.addRows([HEADERS, ...SAMPLE_ROWS, ...Array.from({ length: 10 }, () => Array(HEADERS.length).fill(''))]);
  [28, 14, 13, 22, 28, 22, 30, 18, 22, 30, 18, 24, 16, 18, 12, 18, 16, 20, 14, 36].forEach((width, index) => { template.getColumn(index + 1).width = width; });
  styleHeader(template);

  const guide = workbook.addWorksheet('Field Guide');
  guide.addRows(FIELD_GUIDE);
  [26, 10, 60].forEach((width, index) => { guide.getColumn(index + 1).width = width; });
  styleHeader(guide);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'customers_template.xlsx';
  anchor.click();
  URL.revokeObjectURL(url);
}
