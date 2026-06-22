// ============================================================
// Excel Export Engine
// ============================================================

import * as XLSX from 'xlsx';
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
    // A section A entry has description1. If both description1 and description2 are absent/empty, we default to Section A.
    const isSecB = item.description2 !== null && item.description2 !== '';

    if (!isSecB) {
      // SECTION A (5 columns: BIGA, DESCRIPTION, KAIT KA NAME, RATE (PER BIGA), TOTAL)
      row.push(item.quantity ?? ''); // BIGA
      row.push(item.work_type || ''); // DESCRIPTION
      row.push(item.khait_ka_naam || ''); // KAIT KA NAME
      row.push(item.rate ?? ''); // RATE
      row.push(item.debit); // TOTAL
      totalA += item.debit;
      totalBigaA += item.quantity || 0;

      // SECTION B (6 empty columns: DESCRIPTION, KAIT KA NAME, BIGA, TIME, RATE (PER BIGA/HOURS), TOTAL)
      row.push('', '', '', '', '', '');
    } else {
      // SECTION A is empty (5 empty columns: BIGA, DESCRIPTION, KAIT KA NAME, RATE (PER BIGA), TOTAL)
      row.push('', '', '', '', '');

      // SECTION B (6 columns: DESCRIPTION, KAIT KA NAME, BIGA, TIME, RATE (PER BIGA/HOURS), TOTAL)
      row.push(item.work_type || ''); // DESCRIPTION
      row.push(item.khait_ka_naam || ''); // KAIT KA NAME
      
      const unitLower = item.unit?.toLowerCase() || '';
      const isArea = unitLower.includes('biga') || unitLower.includes('bigha') || unitLower === 'acre';
      row.push(isArea ? (item.quantity ?? '') : ''); // BIGA

      // Format TIME column as Xhour Y minutes if unit is Hours
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

  // Totals row (15 columns)
  rows.push([
    '', '', '', totalBigaA || '', '', '', 'Total-A', totalA,
    '', '', totalBigaB || '', formattedTotalTimeB, 'Total-B', totalB,
    totalA + totalB
  ]);

  // Spacer row
  rows.push([]);

  // Deposit/Remaining Balance summary positioned at the bottom right under Section B Total / Grand Total columns
  rows.push([
    '', '', '', '', '', '', '', '', '', '', '', '', '',
    'जमा (Deposits)', totalDeposits
  ]);
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

  XLSX.utils.book_append_sheet(wb, ws, 'Ledger');

  const timestamp = new Date().toISOString().split('T')[0];
  await saveAndShareWorkbook(
    wb,
    `${farmer.name}_Ledger_${timestamp}.xlsx`
  );
}

export async function exportAllFarmersReport(
  startDate?: string,
  endDate?: string
): Promise<void> {
  const data = await getAllFarmersReport(startDate, endDate);

  const wb = XLSX.utils.book_new();

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
    { wch: 20 }, // Farmer
    { wch: 15 }, // Village
    { wch: 12 }, // Date
    { wch: 15 }, // Type
    { wch: 15 }, // Amount
    { wch: 20 }, // Description 1
    { wch: 20 }, // Description 2
    { wch: 20 }, // Khait Ka Naam
    { wch: 25 }, // Notes
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'All Farmers');

  const timestamp = new Date().toISOString().split('T')[0];
  await saveAndShareWorkbook(wb, `All_Farmers_Report_${timestamp}.xlsx`);
}

export async function exportOutstandingReport(): Promise<void> {
  const data = await getOutstandingReport();

  const wb = XLSX.utils.book_new();

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
  rows.push(['TOTAL', '', totalWork, totalDeposits, totalPending] as any);

  const ws = XLSX.utils.aoa_to_sheet([...headerData, ...rows]);

  ws['!cols'] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Outstanding');

  const timestamp = new Date().toISOString().split('T')[0];
  await saveAndShareWorkbook(wb, `Outstanding_Report_${timestamp}.xlsx`);
}

export async function exportMonthlySummary(year?: number): Promise<void> {
  const data = await getMonthlySummary(year);

  const wb = XLSX.utils.book_new();

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
  rows.push(['TOTAL', totalWork, totalDeposits, totalOutstanding] as any);

  const ws = XLSX.utils.aoa_to_sheet([...headerData, ...rows]);

  ws['!cols'] = [
    { wch: 15 },
    { wch: 18 },
    { wch: 15 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Monthly Summary');

  const timestamp = new Date().toISOString().split('T')[0];
  await saveAndShareWorkbook(
    wb,
    `Monthly_Summary_${year || new Date().getFullYear()}_${timestamp}.xlsx`
  );
}
