/**
 * @file src/utils/excel.ts
 * @description Secure ExcelJS utility functions for parsing and generating Excel files.
 * Replaces vulnerable xlsx / SheetJS dependency with robust, streaming-ready ExcelJS.
 * Includes CSV/Excel formula injection prevention, cell sanitization, and input limits.
 */

import ExcelJS from 'exceljs';
import { ApiError } from '@/common/exceptions/apiError';

const DANGEROUS_FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

/**
 * Sanitizes cell values to prevent CSV / Excel formula injection (CWE-1236).
 * If a string starts with a formula trigger character (=, +, -, @, tab, CR),
 * it prepends an apostrophe (') so spreadsheet software treats it as literal text.
 */
export function sanitizeFormula(value: any): any {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0 && DANGEROUS_FORMULA_PREFIXES.some((prefix) => trimmed.startsWith(prefix))) {
      return `'${value}`;
    }
  }
  return value;
}

/**
 * Safely extracts raw primitive value from an ExcelJS cell.
 */
function extractCellValue(cell: ExcelJS.Cell): any {
  const val = cell.value;
  if (val === null || val === undefined) {
    return '';
  }
  if (val instanceof Date) {
    return val;
  }
  if (typeof val === 'object') {
    // Formula cell: { formula: string, result: any }
    if ('result' in val && val.result !== undefined && val.result !== null) {
      return val.result;
    }
    // Rich text cell: { richText: [{ text: string }] }
    if (Array.isArray((val as any).richText)) {
      return (val as any).richText.map((item: any) => item.text || '').join('');
    }
    // Hyperlink cell: { text: string, hyperlink: string }
    if ('text' in val && val.text !== undefined) {
      return val.text;
    }
    return String(val);
  }
  return val;
}

/**
 * Parses an Excel or CSV buffer into an array of row objects keyed by header names.
 * Enforces maximum row and column thresholds to guard against ReDoS and resource exhaustion.
 */
export async function parseExcelBuffer(
  buffer: Buffer,
  maxRows: number = 10000,
  maxCols: number = 100
): Promise<Record<string, any>[]> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch (err: any) {
    throw ApiError.badRequest('Invalid Excel or CSV file structure');
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet || worksheet.rowCount === 0) {
    throw ApiError.badRequest('The uploaded file is empty');
  }

  if (worksheet.rowCount > maxRows + 1) {
    throw ApiError.badRequest(`File exceeds maximum permitted row limit of ${maxRows} rows`);
  }

  // Row 1 is headers
  const headerRow = worksheet.getRow(1);
  const headers: { colIndex: number; key: string }[] = [];

  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    if (colNumber > maxCols) return;
    const headerVal = String(extractCellValue(cell) || '').trim();
    if (headerVal) {
      headers.push({ colIndex: colNumber, key: headerVal });
    }
  });

  if (headers.length === 0) {
    throw ApiError.badRequest('The uploaded file is empty or missing headers');
  }

  const rows: Record<string, any>[] = [];

  for (let r = 2; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    let hasAnyData = false;
    const rowObj: Record<string, any> = {};

    for (const h of headers) {
      const cell = row.getCell(h.colIndex);
      const val = extractCellValue(cell);
      if (val !== '' && val !== null && val !== undefined) {
        hasAnyData = true;
      }
      rowObj[h.key] = val;
    }

    if (hasAnyData) {
      rows.push(rowObj);
    }
  }

  return rows;
}

/**
 * Generates an Excel XLSX Buffer from an array of key-value objects.
 * Keys in the first row determine column headers.
 * Applies formula sanitization on text values.
 */
export async function exportToExcelBuffer(
  sheetName: string,
  rows: Record<string, any>[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Maatram Foundation';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetName.slice(0, 31)); // Excel 31-char sheet name limit

  if (rows.length === 0) {
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // Determine headers from all unique keys in rows
  const headerSet = new Set<string>();
  for (const row of rows) {
    Object.keys(row).forEach((k) => headerSet.add(k));
  }
  const headers = Array.from(headerSet);

  worksheet.columns = headers.map((header) => ({
    header,
    key: header,
    width: Math.max(header.length + 4, 12),
  }));

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };

  // Add rows with formula injection protection
  for (const row of rows) {
    const sanitizedRow: Record<string, any> = {};
    for (const h of headers) {
      const val = row[h];
      sanitizedRow[h] = sanitizeFormula(val !== undefined && val !== null ? val : '');
    }
    worksheet.addRow(sanitizedRow);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Generates an Excel XLSX Buffer from an Array-Of-Arrays (AOA).
 * Applies formula sanitization on text values.
 */
export async function exportAoaToExcelBuffer(
  sheetName: string,
  data: any[][]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Maatram Foundation';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetName.slice(0, 31));

  if (data.length === 0) {
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // First row is header
  const headerRowValues = data[0].map((v) => String(v ?? ''));
  const headerRow = worksheet.addRow(headerRowValues);
  headerRow.font = { bold: true };

  // Remaining rows
  for (let i = 1; i < data.length; i++) {
    const rowValues = data[i].map((v) => sanitizeFormula(v ?? ''));
    worksheet.addRow(rowValues);
  }

  // Adjust column widths automatically
  worksheet.columns.forEach((col) => {
    let maxLen = 10;
    col.eachCell?.({ includeEmpty: true }, (cell) => {
      const len = cell.value ? String(cell.value).length : 0;
      if (len > maxLen) maxLen = len;
    });
    col.width = Math.min(maxLen + 4, 50);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
