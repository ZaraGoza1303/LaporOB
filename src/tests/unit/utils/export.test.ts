import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import {
  buildExportFilename,
  toObPerformanceExcel,
  type ObPerformanceExportInput,
} from '../../../utils/excel.js';

const performanceInput: ObPerformanceExportInput = {
  produktivitas: 85.5,
  tugas_selesai: 17,
  tugas_total: 20,
  laporan_menunggu: 3,
  perbandingan: [{ nama_ob: 'Joko Prasetyo', total_tugas: 20, tugas_selesai: 17, persentase: 85 }],
  tren: [{ label: 'Sep 2026', total: 30, selesai: 25 }],
};

async function sheetNames(buffer: Buffer): Promise<string[]> {  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  return wb.worksheets.map((ws) => ws.name);
}

describe('toObPerformanceExcel', () => {
  it('membuat sheet Ringkasan, Perbandingan OB, dan Tren Bulanan', async () => {
    const buffer = await toObPerformanceExcel(performanceInput);
    expect(await sheetNames(buffer)).toEqual(['Ringkasan', 'Perbandingan OB', 'Tren Bulanan']);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer);
    expect(wb.getWorksheet('Ringkasan')!.getRow(2).getCell(2).value).toBe(85.5);
    expect(wb.getWorksheet('Perbandingan OB')!.getRow(2).getCell(1).value).toBe('Joko Prasetyo');
    expect(wb.getWorksheet('Tren Bulanan')!.getRow(2).getCell(1).value).toBe('Sep 2026');
  });
});

describe('buildExportFilename', () => {
  it('membuat nama file xlsx dengan cap waktu', () => {
    expect(buildExportFilename('performa-ob', new Date(2026, 8, 22, 9, 5))).toBe('performa-ob-20260922-0905.xlsx');
  });
});
