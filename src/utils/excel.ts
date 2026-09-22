import ExcelJS from 'exceljs';

export interface ObPerformanceExportInput {
    produktivitas: number;
    tugas_selesai: number;
    tugas_total: number;
    laporan_menunggu: number;
    perbandingan: Array<{
        nama_ob: string;
        total_tugas: number;
        tugas_selesai: number;
        persentase: number;
    }>;
    tren: Array<{
        label: string;
        total: number;
        selesai: number;
    }>;
}

export function buildExportFilename(prefix: string, now: Date = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
    return `${prefix}-${stamp}.xlsx`;
}

function styleHeader(sheet: ExcelJS.Worksheet): void {
    sheet.getRow(1).font = { bold: true };
}

export async function toObPerformanceExcel(input: ObPerformanceExportInput): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    const ringkasan = workbook.addWorksheet("Ringkasan");
    ringkasan.columns = [
        { header: "Metrik", key: "metrik", width: 28 },
        { header: "Nilai", key: "nilai", width: 20 },
    ];
    styleHeader(ringkasan);
    ringkasan.addRows([
        { metrik: "Produktivitas (%)", nilai: input.produktivitas },
        { metrik: "Tugas selesai", nilai: input.tugas_selesai },
        { metrik: "Total tugas", nilai: input.tugas_total },
        { metrik: "Laporan menunggu", nilai: input.laporan_menunggu },
    ]);

    const banding = workbook.addWorksheet("Perbandingan OB");
    banding.columns = [
        { header: "Nama OB", key: "nama", width: 28 },
        { header: "Total Tugas", key: "total", width: 14 },
        { header: "Selesai", key: "selesai", width: 14 },
        { header: "Persentase (%)", key: "persen", width: 16 },
    ];
    styleHeader(banding);
    for (const o of input.perbandingan) {
        banding.addRow({ nama: o.nama_ob, total: o.total_tugas, selesai: o.tugas_selesai, persen: o.persentase });
    }

    const tren = workbook.addWorksheet("Tren Bulanan");
    tren.columns = [
        { header: "Bulan", key: "bulan", width: 16 },
        { header: "Total Laporan", key: "total", width: 16 },
        { header: "Selesai", key: "selesai", width: 14 },
    ];
    styleHeader(tren);
    for (const t of input.tren) {
        tren.addRow({ bulan: t.label, total: t.total, selesai: t.selesai });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}
