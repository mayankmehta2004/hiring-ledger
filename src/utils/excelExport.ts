// ============================================================
// Excel Export Engine (with full formatting via xlsx-js-style)
// ============================================================

import * as XLSX from 'xlsx-js-style';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  getFarmerLedgerReport,
  getAllFarmersReport,
  getOutstandingReport,
  getMonthlySummary,
} from '../database/reports';
import { getFarmer } from '../database/farmers';
import { APP_CONFIG } from '../constants/config';
import { formatMonthYear } from './formatDate';

// ── Shared style helpers ──────────────────────────────────────

const BORDER_THIN = {
  top: { style: 'thin' as const, color: { rgb: '000000' } },
  bottom: { style: 'thin' as const, color: { rgb: '000000' } },
  left: { style: 'thin' as const, color: { rgb: '000000' } },
  right: { style: 'thin' as const, color: { rgb: '000000' } },
};

const CENTER: XLSX.CellStyle['alignment'] = {
  horizontal: 'center',
  vertical: 'center',
  wrapText: true,
};

function titleStyle(sz = 16): XLSX.CellStyle {
  return {
    font: { bold: true, sz, name: 'Calibri' },
    alignment: CENTER,
  };
}

function headerStyle(): XLSX.CellStyle {
  return {
    font: { bold: true, sz: 12, name: 'Calibri', color: { rgb: 'FFFFFF' } },
    alignment: CENTER,
    fill: { fgColor: { rgb: '4472C4' } },
    border: BORDER_THIN,
  };
}

function sectionHeaderStyle(): XLSX.CellStyle {
  return {
    font: { bold: true, sz: 13, name: 'Calibri', color: { rgb: 'FFFFFF' } },
    alignment: CENTER,
    fill: { fgColor: { rgb: '2F5496' } },
    border: BORDER_THIN,
  };
}

function cellStyle(): XLSX.CellStyle {
  return {
    font: { sz: 11, name: 'Calibri' },
    alignment: CENTER,
    border: BORDER_THIN,
  };
}

function totalRowStyle(): XLSX.CellStyle {
  return {
    font: { bold: true, sz: 12, name: 'Calibri' },
    alignment: CENTER,
    border: BORDER_THIN,
    fill: { fgColor: { rgb: 'D9E2F3' } },
  };
}

function subtitleStyle(sz = 12): XLSX.CellStyle {
  return {
    font: { bold: true, sz, name: 'Calibri' },
    alignment: CENTER,
  };
}

/** Apply a style to every cell in the sheet, with special styles for header rows */
function applyStylesToSheet(
  ws: XLSX.WorkSheet,
  titleRows: number,
  headerRow: number,
  totalCols: number,
  sectionHeaderRow?: number,
  totalRowIndices?: number[],
): void {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C < totalCols; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[addr]) ws[addr] = { t: 's', v: '' };

      if (R < titleRows) {
        // Title / subtitle rows
        ws[addr].s = titleStyle(R === 0 ? 16 : 12);
      } else if (sectionHeaderRow !== undefined && R === sectionHeaderRow) {
        ws[addr].s = sectionHeaderStyle();
      } else if (R === headerRow) {
        ws[addr].s = headerStyle();
      } else if (totalRowIndices && totalRowIndices.includes(R)) {
        ws[addr].s = totalRowStyle();
      } else if (R >= titleRows) {
        ws[addr].s = cellStyle();
      }
    }
  }
}

async function saveAndShareWorkbook(
  wb: XLSX.WorkBook,
  fileName: string
): Promise<void> {
  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const dir = `${FileSystem.documentDirectory}exports/`;

  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }

  const filePath = `${dir}${fileName}`;
  await FileSystem.writeAsStringAsync(filePath, wbout, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: `Share ${fileName}`,
    });
  }
}

// ── Export: Farmer Ledger ─────────────────────────────────────

export async function exportFarmerLedger(
  farmerId: number,
  startDate?: string,
  endDate?: string
): Promise<void> {
  const farmer = await getFarmer(farmerId);
  if (!farmer) throw new Error('Farmer not found');

  const data = await getFarmerLedgerReport(farmerId, startDate, endDate);

  // Filter entries
  const workEntries = data.filter((r) => r.type === 'Work');
  const deposits = data.filter((r) => r.type === 'Deposit');
  const totalDeposits = deposits.reduce((sum, r) => sum + r.credit, 0);

  const wb = XLSX.utils.book_new();

  const titleHeader = `HARSH HIRING CENTER (CHC) IKROTIYA MOBILE NO.9799227791 (RAMESH CHAND)`;

  // Header info (15 columns total)
  const headerData = [
    [titleHeader],
    [`Farmer Ledger: ${farmer.name}`],
    [`Phone: ${farmer.phone || '-'}`],
    [`Village: ${farmer.village || '-'}`],
    [`Statement Date: ${new Date().toLocaleDateString('en-IN')}`],
    [],
    [
      'SECTION A: FIELD WORK (CHASSIS/TRACTOR)', '', '', '', '', '', '', '',
      'SECTION B: TOOL / HOURLY WORK', '', '', '', '', '',
      'SUMMARY'
    ],
    [
      'SR.NO.',
      'DATE',
      'NAME',
      'BIGA',
      'DESCRIPTION',
      'KAIT KA NAME',
      'RATE (PER BIGA)',
      'TOTAL',
      'DESCRIPTION',
      'KAIT KA NAME',
      'BIGA',
      'TIME',
      'RATE (PER BIGA/HOURS)',
      'TOTAL',
      'GRAND TOTAL (A+B)'
    ]
  ];

  const rows: any[] = [];
  let totalA = 0;
  let totalB = 0;
  let totalBigaA = 0;
  let totalBigaB = 0;
  let totalTimeB = 0;

  for (let i = 0; i < workEntries.length; i++) {
    const item = workEntries[i];
    const row: any[] = [];

    // Columns A-C (SR.NO, DATE, NAME) are common
    row.push(i + 1); // SR.NO.
    row.push(item.date); // DATE
    row.push(farmer.name); // NAME

    // Check if it's Section A or Section B
    const isSecB = item.description2 !== null && item.description2 !== '';

    if (!isSecB) {
      // SECTION A
      row.push(item.quantity ?? ''); // BIGA
      row.push(item.work_type || ''); // DESCRIPTION
      row.push(item.khait_ka_naam || ''); // KAIT KA NAME
      row.push(item.rate ?? ''); // RATE
      row.push(item.debit); // TOTAL
      totalA += item.debit;
      totalBigaA += item.quantity || 0;

      // SECTION B empty
      row.push('', '', '', '', '', '');
    } else {
      // SECTION A empty
      row.push('', '', '', '', '');

      // SECTION B
      row.push(item.work_type || ''); // DESCRIPTION
      row.push(item.khait_ka_naam || ''); // KAIT KA NAME

      const unitLower = item.unit?.toLowerCase() || '';
      const isArea = unitLower.includes('biga') || unitLower.includes('bigha') || unitLower === 'acre';
      row.push(isArea ? (item.quantity ?? '') : ''); // BIGA

      // Format TIME column
      let timeVal = '';
      if (!isArea && item.quantity !== null && item.quantity !== undefined) {
        if (unitLower === 'hours') {
          const h = Math.floor(item.quantity);
          const m = Math.round((item.quantity - h) * 60);
          if (h > 0 && m > 0) {
            timeVal = `${h}hour ${m} minutes`;
          } else if (h > 0) {
            timeVal = `${h}hour`;
          } else if (m > 0) {
            timeVal = `${m} minutes`;
          } else {
            timeVal = '0hour';
          }
        } else {
          timeVal = String(item.quantity);
        }
      }
      row.push(timeVal); // TIME

      row.push(item.rate ?? ''); // RATE
      row.push(item.debit); // TOTAL
      totalB += item.debit;
      if (isArea) {
        totalBigaB += item.quantity || 0;
      } else {
        totalTimeB += item.quantity || 0;
      }
    }

    // Column O: GRAND TOTAL (A+B) for this row
    row.push(item.debit);

    rows.push(row);
  }

  // Format Total Time B
  let formattedTotalTimeB = '';
  if (totalTimeB > 0) {
    const h = Math.floor(totalTimeB);
    const m = Math.round((totalTimeB - h) * 60);
    if (h > 0 && m > 0) {
      formattedTotalTimeB = `${h}hour ${m} minutes`;
    } else if (h > 0) {
      formattedTotalTimeB = `${h}hour`;
    } else if (m > 0) {
      formattedTotalTimeB = `${m} minutes`;
    }
  }

  // Totals row
  const totalsRowIdx = headerData.length + rows.length;
  rows.push([
    '', '', '', totalBigaA || '', '', '', 'Total-A', totalA,
    '', '', totalBigaB || '', formattedTotalTimeB, 'Total-B', totalB,
    totalA + totalB
  ]);

  // Spacer row
  rows.push([]);

  // Deposit/Remaining Balance summary
  const depositRowIdx = headerData.length + rows.length;
  rows.push([
    '', '', '', '', '', '', '', '', '', '', '', '', '',
    'जमा (Deposits)', totalDeposits
  ]);
  const balanceRowIdx = headerData.length + rows.length;
  rows.push([
    '', '', '', '', '', '', '', '', '', '', '', '', '',
    'बाकी (Balance Due)', (totalA + totalB) - totalDeposits
  ]);

  // Spacer row
  rows.push([]);

  // Note footer
  rows.push(['Note:-Interest will be charged @24% if payment not made in time.']);

  const ws = XLSX.utils.aoa_to_sheet([...headerData, ...rows]);

  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // Col A: SR.NO.
    { wch: 12 }, // Col B: DATE
    { wch: 15 }, // Col C: NAME
    { wch: 8 },  // Col D: BIGA (A)
    { wch: 20 }, // Col E: DESCRIPTION (A)
    { wch: 18 }, // Col F: KAIT KA NAME (A)
    { wch: 15 }, // Col G: RATE (PER BIGA) (A)
    { wch: 12 }, // Col H: TOTAL (A)
    { wch: 20 }, // Col I: DESCRIPTION (B)
    { wch: 18 }, // Col J: KAIT KA NAME (B)
    { wch: 8 },  // Col K: BIGA (B)
    { wch: 12 }, // Col L: TIME (B)
    { wch: 18 }, // Col M: RATE (PER BIGA/HOURS) (B)
    { wch: 12 }, // Col N: TOTAL (B)
    { wch: 18 }, // Col O: GRAND TOTAL (A+B) (Summary)
  ];

  // Merges for title rows (rows 0-4 merge across all 15 cols)
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 14 } }, // Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: 14 } }, // Farmer name
    { s: { r: 2, c: 0 }, e: { r: 2, c: 14 } }, // Phone
    { s: { r: 3, c: 0 }, e: { r: 3, c: 14 } }, // Village
    { s: { r: 4, c: 0 }, e: { r: 4, c: 14 } }, // Statement Date
    // Section headers row 6
    { s: { r: 6, c: 0 }, e: { r: 6, c: 7 } },  // Section A header
    { s: { r: 6, c: 8 }, e: { r: 6, c: 13 } },  // Section B header
  ];

  // Apply formatting
  applyStylesToSheet(ws, 5, 7, 15, 6, [totalsRowIdx, depositRowIdx, balanceRowIdx]);

  // Row heights for title
  ws['!rows'] = [
    { hpt: 30 }, // Title row
    { hpt: 22 }, // Farmer name
    { hpt: 18 }, // Phone
    { hpt: 18 }, // Village
    { hpt: 18 }, // Statement Date
    { hpt: 10 }, // Spacer
    { hpt: 24 }, // Section headers
    { hpt: 24 }, // Column headers
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Ledger');

  const timestamp = new Date().toISOString().split('T')[0];
  await saveAndShareWorkbook(
    wb,
    `${farmer.name}_Ledger_${timestamp}.xlsx`
  );
}

// ── Export: All Farmers Report ────────────────────────────────

export async function exportAllFarmersReport(
  startDate?: string,
  endDate?: string
): Promise<void> {
  const data = await getAllFarmersReport(startDate, endDate);

  const wb = XLSX.utils.book_new();
  const COLS = 9;

  const headerData = [
    [APP_CONFIG.appName],
    ['All Farmers Report'],
    [`Generated: ${new Date().toLocaleDateString('en-IN')}`],
    [],
    ['Farmer', 'Village', 'Date', 'Type', 'Amount (₹)', 'Description 1', 'Description 2', 'Khait Ka Naam', 'Notes'],
  ];

  const rows = data.map((row) => [
    row.farmer_name,
    row.village,
    row.date,
    row.type,
    row.amount,
    row.description1 || '',
    row.description2 || '',
    row.khait_ka_naam || '',
    row.notes || '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([...headerData, ...rows]);

  ws['!cols'] = [
    { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
    { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 25 },
  ];

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: COLS - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: COLS - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: COLS - 1 } },
  ];

  ws['!rows'] = [{ hpt: 28 }, { hpt: 22 }, { hpt: 18 }, { hpt: 10 }, { hpt: 24 }];

  applyStylesToSheet(ws, 3, 4, COLS);

  XLSX.utils.book_append_sheet(wb, ws, 'All Farmers');

  const timestamp = new Date().toISOString().split('T')[0];
  await saveAndShareWorkbook(wb, `All_Farmers_Report_${timestamp}.xlsx`);
}

// ── Export: Outstanding Report ────────────────────────────────

export async function exportOutstandingReport(): Promise<void> {
  const data = await getOutstandingReport();

  const wb = XLSX.utils.book_new();
  const COLS = 5;

  const headerData = [
    [APP_CONFIG.appName],
    ['Outstanding Balances Report'],
    [`Generated: ${new Date().toLocaleDateString('en-IN')}`],
    [],
    ['Farmer', 'Village', 'Work Total (₹)', 'Deposits (₹)', 'Pending (₹)'],
  ];

  const rows = data.map((row) => [
    row.farmer_name,
    row.village,
    row.work_total,
    row.deposits_total,
    row.pending,
  ]);

  // Add totals
  const totalWork = data.reduce((sum, r) => sum + r.work_total, 0);
  const totalDeposits = data.reduce((sum, r) => sum + r.deposits_total, 0);
  const totalPending = data.reduce((sum, r) => sum + r.pending, 0);
  rows.push([]);
  const totalRowIdx = headerData.length + rows.length;
  rows.push(['TOTAL', '', totalWork, totalDeposits, totalPending] as any);

  const ws = XLSX.utils.aoa_to_sheet([...headerData, ...rows]);

  ws['!cols'] = [
    { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
  ];

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: COLS - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: COLS - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: COLS - 1 } },
  ];

  ws['!rows'] = [{ hpt: 28 }, { hpt: 22 }, { hpt: 18 }, { hpt: 10 }, { hpt: 24 }];

  applyStylesToSheet(ws, 3, 4, COLS, undefined, [totalRowIdx]);

  XLSX.utils.book_append_sheet(wb, ws, 'Outstanding');

  const timestamp = new Date().toISOString().split('T')[0];
  await saveAndShareWorkbook(wb, `Outstanding_Report_${timestamp}.xlsx`);
}

// ── Export: Monthly Summary ───────────────────────────────────

export async function exportMonthlySummary(year?: number): Promise<void> {
  const data = await getMonthlySummary(year);

  const wb = XLSX.utils.book_new();
  const COLS = 4;

  const headerData = [
    [APP_CONFIG.appName],
    [`Monthly Business Summary - ${year || new Date().getFullYear()}`],
    [`Generated: ${new Date().toLocaleDateString('en-IN')}`],
    [],
    ['Month', 'Work Amount (₹)', 'Deposits (₹)', 'Outstanding (₹)'],
  ];

  const rows = data.map((row) => [
    formatMonthYear(row.month),
    row.work_amount,
    row.deposits,
    row.outstanding,
  ]);

  // Totals
  const totalWork = data.reduce((sum, r) => sum + r.work_amount, 0);
  const totalDeposits = data.reduce((sum, r) => sum + r.deposits, 0);
  const totalOutstanding = data.reduce((sum, r) => sum + r.outstanding, 0);
  rows.push([]);
  const totalRowIdx = headerData.length + rows.length;
  rows.push(['TOTAL', totalWork, totalDeposits, totalOutstanding] as any);

  const ws = XLSX.utils.aoa_to_sheet([...headerData, ...rows]);

  ws['!cols'] = [
    { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 18 },
  ];

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: COLS - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: COLS - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: COLS - 1 } },
  ];

  ws['!rows'] = [{ hpt: 28 }, { hpt: 22 }, { hpt: 18 }, { hpt: 10 }, { hpt: 24 }];

  applyStylesToSheet(ws, 3, 4, COLS, undefined, [totalRowIdx]);

  XLSX.utils.book_append_sheet(wb, ws, 'Monthly Summary');

  const timestamp = new Date().toISOString().split('T')[0];
  await saveAndShareWorkbook(
    wb,
    `Monthly_Summary_${year || new Date().getFullYear()}_${timestamp}.xlsx`
  );
}
