import { Readable } from 'stream';
import { Workbook, Worksheet } from 'exceljs';

function worksheetRows(worksheet: Worksheet): Record<string, string>[] {
  const headers: string[] = [];
  worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, column) => {
    headers[column - 1] = cell.text.trim();
  });

  const rows: Record<string, string>[] = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: Record<string, string> = {};
    let hasValue = false;
    headers.forEach((header, index) => {
      if (!header) return;
      const value = row.getCell(index + 1).text.trim();
      record[header] = value;
      if (value) hasValue = true;
    });
    if (hasValue) rows.push(record);
  });
  return rows;
}

export async function readSpreadsheetRows(buffer: Buffer, extension: string): Promise<Record<string, string>[]> {
  const workbook = new Workbook();
  let worksheet: Worksheet | undefined;

  if (extension === 'csv') {
    worksheet = await workbook.csv.read(Readable.from([buffer]));
  } else if (extension === 'xlsx') {
    // ExcelJS still declares Node's pre-generic Buffer type. Keep the cast at
    // this compatibility boundary while accepting current @types/node buffers.
    await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
    worksheet = workbook.worksheets[0];
  }

  if (!worksheet) return [];
  return worksheetRows(worksheet);
}
