import { beforeEach, describe, expect, it } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient } from '../../../generated/prisma/client.js';
import { KaryawanRepository } from '../../../repositories/karyawan_repository.js';

const mockDB = mockDeep<PrismaClient>();
const mockKaryawanRepo = new KaryawanRepository(mockDB);

beforeEach(() => {
    mockReset(mockDB);
});

const userId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';

describe('KaryawanRepository.getKaryawanPerformanceStats', () => {
    it('mengembalikan jumlah laporan milik karyawan', async () => {
        mockDB.laporan_karyawan.count.mockResolvedValue(7);

        const data = await mockKaryawanRepo.getKaryawanPerformanceStats(userId);

        expect(mockDB.laporan_karyawan.count).toHaveBeenCalledWith({
            where: { pelapor_id: userId },
        });
        expect(data).toBe(7);
    });

    it('mengembalikan 0 jika belum ada laporan', async () => {
        mockDB.laporan_karyawan.count.mockResolvedValue(0);

        const data = await mockKaryawanRepo.getKaryawanPerformanceStats(userId);

        expect(data).toBe(0);
    });
});
