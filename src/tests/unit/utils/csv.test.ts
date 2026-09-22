import { describe, expect, it } from 'vitest';
import { buildExportFilename, escapeCsvCell, toLaporanCsv } from '../../../utils/csv.js';
import type { AdminLaporanItemResponse } from '../../../types/admin.js';

const sampleItem: AdminLaporanItemResponse = {
  id: 'uuid-1',
  id_laporan: 'LPR - 001',
  nama_karyawan: 'Budi Santoso',
  lokasi: 'Gedung A Lantai 2',
  lokasi_id: 'lok-1',
  lantai_id: 'lantai-1',
  nomor_lantai: 2,
  kategori: 'Kebersihan',
  prioritas: 'STANDARD',
  status: 'BELUM_DIKERJAKAN',
  nama_ob: 'Slamet',
  created_at: '2026-09-22T00:00:00.000Z',
  updated_at: '2026-09-22T00:00:00.000Z',
};

describe('escapeCsvCell', () => {
  it('mengembalikan teks biasa tanpa kutip', () => {
    expect(escapeCsvCell('Gedung A')).toBe('Gedung A');
  });

  it('membungkus koma, kutip, dan baris baru dengan escaping ganda', () => {
    expect(escapeCsvCell('A, B')).toBe('"A, B"');
    expect(escapeCsvCell('kata "kunci"')).toBe('"kata ""kunci"""');
    expect(escapeCsvCell('baris1\nbaris2')).toBe('"baris1\nbaris2"');
  });

  it('mengubah null/undefined menjadi kosong', () => {
    expect(escapeCsvCell(null)).toBe('');
    expect(escapeCsvCell(undefined)).toBe('');
  });
});

describe('toLaporanCsv', () => {
  it('menghasilkan header + satu baris data', () => {
    const csv = toLaporanCsv([sampleItem]);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('id_laporan,nama_karyawan,lokasi,kategori,prioritas,status,nama_ob,created_at,updated_at');
    expect(lines[1]).toContain('LPR - 001');
    expect(lines[1]).toContain('Budi Santoso');
  });

  it('menghasilkan hanya header saat data kosong', () => {
    expect(toLaporanCsv([]).split('\n')).toHaveLength(1);
  });
});

describe('buildExportFilename', () => {
  it('membuat nama file dengan cap waktu', () => {
    const name = buildExportFilename('laporan', new Date(2026, 8, 22, 9, 5));
    expect(name).toBe('laporan-20260922-0905.csv');
  });
});
