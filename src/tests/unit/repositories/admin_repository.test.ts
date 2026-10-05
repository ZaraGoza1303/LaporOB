import { beforeEach, describe, expect, it } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient } from '../../../generated/prisma/client.js';
import { AdminRepository } from '../../../repositories/admin_repository.js';

const mockDB = mockDeep<PrismaClient>();
const mockAdminRepo = new AdminRepository(mockDB);

beforeEach(() => {
    mockReset(mockDB);
});

describe('AdminRepository.getUserStats', () => {
    it('mengembalikan statistik user beserta total ob', async () => {
        mockDB.user.count
            .mockResolvedValueOnce(10)
            .mockResolvedValueOnce(7)
            .mockResolvedValueOnce(3)
            .mockResolvedValueOnce(5);
        mockDB.role.findFirst.mockResolvedValue({ id: 'role-ob', nama_role: 'ob' } as never);

        const data = await mockAdminRepo.getUserStats();

        expect(mockDB.user.count).toHaveBeenCalledTimes(4);
        expect(mockDB.role.findFirst).toHaveBeenCalled();
        expect(data).toEqual({
            totalUsers: 10,
            activeUsers: 7,
            nonActiveUsers: 3,
            totalOB: 5,
        });
    });

    it('mengembalikan total ob 0 jika role ob tidak ada', async () => {
        mockDB.user.count
            .mockResolvedValueOnce(10)
            .mockResolvedValueOnce(7)
            .mockResolvedValueOnce(3);
        mockDB.role.findFirst.mockResolvedValue(null);

        const data = await mockAdminRepo.getUserStats();

        expect(data.totalOB).toBe(0);
        expect(mockDB.user.count).toHaveBeenCalledTimes(3);
    });
});

describe('AdminRepository.assignObToLocations', () => {
    it('menugaskan ob ke beberapa lokasi dalam transaksi', async () => {
        mockDB.$transaction.mockResolvedValue([] as never);

        await mockAdminRepo.assignObToLocations(
            'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2',
            ['lokasi-1', 'lokasi-2'],
            1,
            2026
        );

        expect(mockDB.$transaction).toHaveBeenCalledTimes(1);
    });

    it('hanya menghapus penugasan lama jika lokasi kosong', async () => {
        mockDB.$transaction.mockResolvedValue([] as never);

        await mockAdminRepo.assignObToLocations(
            'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2',
            [],
            1,
            2026
        );

        expect(mockDB.$transaction).toHaveBeenCalledTimes(1);
    });
});

describe('AdminRepository.getPenugasanByPeriode', () => {
    it('mengembalikan penugasan berdasarkan bulan dan tahun', async () => {
        const fakePenugasan = [{ id: 'penugasan-1' }];
        mockDB.penugasanOb.findMany.mockResolvedValue(fakePenugasan as never);

        const data = await mockAdminRepo.getPenugasanByPeriode(1, 2026);

        expect(mockDB.penugasanOb.findMany).toHaveBeenCalledWith({
            where: { bulan: 1, tahun: 2026 },
            include: expect.any(Object),
        });
        expect(data).toEqual(fakePenugasan);
    });
});
