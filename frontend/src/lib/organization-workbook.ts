import { Workbook, Worksheet } from 'exceljs';

export type WorkbookCompany = Record<string, string>;
export type WorkbookDirector = Record<string, string>;
export type WorkbookBranch = Record<string, string>;
export type WorkbookLocation = Record<string, string>;
export type WorkbookDepartment = Record<string, string>;

export type OrganizationWorkbookData = {
  company: WorkbookCompany | null;
  directors: WorkbookDirector[];
  branches: WorkbookBranch[];
  locations: WorkbookLocation[];
  departments: WorkbookDepartment[];
};

export type WorkbookIssue = { sheet: string; row: number; message: string };
export type OrganizationWorkbookPreview = OrganizationWorkbookData & { issues: WorkbookIssue[] };

const sheets = {
  Company: ['code', 'name', 'industry', 'incorporated_on', 'email', 'phone', 'website', 'cin', 'gstin', 'pan', 'tan', 'msme_number', 'address', 'city', 'state_province', 'postal_code', 'country', 'base_currency', 'timezone', 'fiscal_year_start_month', 'date_format', 'language_code'],
  Directors: ['name', 'designation', 'din', 'email', 'phone', 'shareholding_percent', 'appointed_on'],
  Branches: ['code', 'name', 'tax_registration_number', 'email', 'phone', 'address', 'city', 'state_province', 'postal_code', 'country'],
  Locations: ['code', 'name', 'branch_code', 'type', 'address', 'city', 'state_province', 'postal_code', 'country'],
  Departments: ['code', 'name', 'description'],
} as const;

function style(sheet: Worksheet) {
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FF17365D' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } };
  header.eachCell((cell) => { cell.border = { bottom: { style: 'thin', color: { argb: 'FF17365D' } } }; });
  sheet.columns.forEach((column) => { column.width = 22; });
}

function addSheet(workbook: Workbook, name: keyof typeof sheets, rows: Record<string, unknown>[]) {
  const sheet = workbook.addWorksheet(name);
  sheet.addRow([...sheets[name]]);
  rows.forEach((record) => sheet.addRow(sheets[name].map((header) => record[header] ?? '')));
  for (let index = 0; index < 8; index++) sheet.addRow(Array(sheets[name].length).fill(''));
  style(sheet);
}

/** Downloads both a backup of current setup data and a reusable import template. */
export async function exportOrganizationWorkbook(data: OrganizationWorkbookData) {
  const workbook = new Workbook();
  addSheet(workbook, 'Company', data.company ? [data.company] : [{ base_currency: 'INR', timezone: 'Asia/Kolkata', fiscal_year_start_month: 'april', date_format: 'dd/MM/yyyy', language_code: 'en', country: 'India' }]);
  addSheet(workbook, 'Directors', data.directors);
  addSheet(workbook, 'Branches', data.branches);
  addSheet(workbook, 'Locations', data.locations);
  addSheet(workbook, 'Departments', data.departments);
  const guide = workbook.addWorksheet('Instructions');
  guide.addRows([
    ['Organization setup import'],
    ['1', 'Export this workbook, edit the five data sheets, then choose Import / preview in MachineIQ.'],
    ['2', 'Nothing is saved during preview. Review every count and validation issue before selecting Apply.'],
    ['3', 'Codes identify branches, locations, and departments. Matching records are updated; new codes are created.'],
    ['4', 'Locations use branch_code to refer to a branch. Valid types: office, warehouse, factory, service.'],
    ['5', 'Director attachments and statutory documents are intentionally not carried in spreadsheets.'],
  ]);
  guide.getColumn(1).width = 18; guide.getColumn(2).width = 110;
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'machineiq_organization_setup.xlsx'; anchor.click();
  URL.revokeObjectURL(url);
}

function readRows(sheet: Worksheet | undefined): Array<{ row: number; data: Record<string, string> }> {
  if (!sheet) return [];
  const headers: string[] = [];
  sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, column) => { headers[column - 1] = cell.text.trim().toLowerCase(); });
  const rows: Array<{ row: number; data: Record<string, string> }> = [];
  sheet.eachRow({ includeEmpty: false }, (source, number) => {
    if (number === 1) return;
    const data: Record<string, string> = {};
    headers.forEach((header, index) => { if (header) data[header] = source.getCell(index + 1).text.trim(); });
    if (Object.values(data).some(Boolean)) rows.push({ row: number, data });
  });
  return rows;
}

function required(issues: WorkbookIssue[], sheet: string, row: number, data: Record<string, string>, fields: string[]) {
  fields.forEach((field) => { if (!data[field]) issues.push({ sheet, row, message: `Missing required column value: ${field}` }); });
}

function duplicates(issues: WorkbookIssue[], sheet: string, rows: Array<{ row: number; data: Record<string, string> }>, key: string) {
  const seen = new Set<string>();
  rows.forEach(({ row, data }) => {
    const value = data[key]?.toLowerCase();
    if (value && seen.has(value)) issues.push({ sheet, row, message: `Duplicate ${key}: ${data[key]}` });
    if (value) seen.add(value);
  });
}

function commonValues(issues: WorkbookIssue[], sheet: string, row: number, data: Record<string, string>) {
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) issues.push({ sheet, row, message: `Invalid email: ${data.email}` });
  if (data.website && !/^https?:\/\//i.test(data.website)) issues.push({ sheet, row, message: 'Website must start with http:// or https://.' });
}

export async function previewOrganizationWorkbook(file: File, context: { hasCompany: boolean; branchCodes: string[] }): Promise<OrganizationWorkbookPreview> {
  if (!file.name.toLowerCase().endsWith('.xlsx')) throw new Error('Organization setup requires the exported .xlsx workbook.');
  const workbook = new Workbook();
  await workbook.xlsx.load(await file.arrayBuffer() as any);
  const issues: WorkbookIssue[] = [];
  (Object.keys(sheets) as Array<keyof typeof sheets>).forEach((name) => {
    const sheet = workbook.getWorksheet(name);
    if (!sheet) issues.push({ sheet: name, row: 1, message: `Missing worksheet: ${name}` });
    else {
      const actual = new Set<string>();
      sheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => actual.add(cell.text.trim().toLowerCase()));
      sheets[name].forEach((header) => { if (!actual.has(header)) issues.push({ sheet: name, row: 1, message: `Missing column: ${header}` }); });
    }
  });

  const companyRows = readRows(workbook.getWorksheet('Company'));
  const directorRows = readRows(workbook.getWorksheet('Directors'));
  const branchRows = readRows(workbook.getWorksheet('Branches'));
  const locationRows = readRows(workbook.getWorksheet('Locations'));
  const departmentRows = readRows(workbook.getWorksheet('Departments'));
  if (companyRows.length > 1) issues.push({ sheet: 'Company', row: companyRows[1].row, message: 'Only one company row is allowed.' });
  if (companyRows[0]) {
    required(issues, 'Company', companyRows[0].row, companyRows[0].data, ['code', 'name', 'base_currency', 'timezone']);
    commonValues(issues, 'Company', companyRows[0].row, companyRows[0].data);
  }
  if (!context.hasCompany && !companyRows[0]) issues.push({ sheet: 'Company', row: 2, message: 'A company row is required before branches, locations, or directors can be imported.' });
  directorRows.forEach((entry) => {
    required(issues, 'Directors', entry.row, entry.data, ['name']); commonValues(issues, 'Directors', entry.row, entry.data);
    if (entry.data.din && !/^\d{8}$/.test(entry.data.din)) issues.push({ sheet: 'Directors', row: entry.row, message: 'DIN must contain exactly 8 digits.' });
    if (entry.data.shareholding_percent && (!Number.isFinite(Number(entry.data.shareholding_percent)) || Number(entry.data.shareholding_percent) < 0 || Number(entry.data.shareholding_percent) > 100)) issues.push({ sheet: 'Directors', row: entry.row, message: 'shareholding_percent must be between 0 and 100.' });
  });
  branchRows.forEach((entry) => { required(issues, 'Branches', entry.row, entry.data, ['code', 'name']); commonValues(issues, 'Branches', entry.row, entry.data); });
  locationRows.forEach((entry) => {
    required(issues, 'Locations', entry.row, entry.data, ['code', 'name', 'branch_code', 'type']);
    if (entry.data.type && !['office', 'warehouse', 'factory', 'service'].includes(entry.data.type.toLowerCase())) issues.push({ sheet: 'Locations', row: entry.row, message: `Invalid type: ${entry.data.type}` });
  });
  departmentRows.forEach((entry) => required(issues, 'Departments', entry.row, entry.data, ['name']));
  duplicates(issues, 'Directors', directorRows.filter((row) => row.data.din), 'din');
  duplicates(issues, 'Branches', branchRows, 'code'); duplicates(issues, 'Locations', locationRows, 'code');
  duplicates(issues, 'Departments', departmentRows.filter((row) => row.data.code), 'code');
  const knownBranches = new Set([...context.branchCodes, ...branchRows.map((row) => row.data.code)].map((value) => value.toLowerCase()));
  locationRows.forEach((entry) => { if (entry.data.branch_code && !knownBranches.has(entry.data.branch_code.toLowerCase())) issues.push({ sheet: 'Locations', row: entry.row, message: `Unknown branch_code: ${entry.data.branch_code}` }); });

  return {
    company: companyRows[0]?.data ?? null,
    directors: directorRows.map((row) => row.data), branches: branchRows.map((row) => row.data),
    locations: locationRows.map((row) => row.data), departments: departmentRows.map((row) => row.data), issues,
  };
}
