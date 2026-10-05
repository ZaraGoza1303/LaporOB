import { beforeEach, describe, expect, it } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient } from '../../../generated/prisma/client.js';
import { ObRepository } from '../../../repositories/ob_repository.js';

const mockDB = mockDeep<PrismaClient>();
const mockObRepo = new ObRepository(mockDB);

beforeEach(() => {
    mockReset(mockDB);
});

const obId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';

// Fungsi generate fake data dan bisa juga override
function createFakeOb() {
    return {
        id: obId,
        username: 'farhan_ob',
        email: 'farhan_ob@gmail.com',
        nama_lengkap: 'Farhan OB',
        profile_picture: null,
        role_id: 'role-ob',
        is_active: true,
        is_deleted: false,
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
        role: { id: 'role-ob', nama_role: 'OB', created_at: new Date('2026-01-01T00:00:00Z') },
    };
}

describe('ObRepository.getObById', () => {
    it('mengembalikan ob beserta role', async () => {
        const fakeOb = createFakeOb();
        mockDB.user.findFirst.mockResolvedValue(fakeOb as never);

        const data = await mockObRepo.getObById(obId);

        expect(mockDB.user.findFirst).toHaveBeenCalledWith({
            where: { id: obId },
            omit: { password: true },
            include: { role: true },
        });
        expect(data).toEqual(fakeOb);
    });

    it('mengembalikan null jika ob tidak ditemukan', async () => {
        mockDB.user.findFirst.mockResolvedValue(null);

        const data = await mockObRepo.getObById('not-exist');

        expect(data).toBeNull();
    });
});

describe('ObRepository.getActiveAssignments', () => {
    it('mengembalikan penugasan aktif beserta lokasi', async () => {
        const fakeAssignments = [
            {
                id: 'penugasan-1',
                user_id: obId,
                lokasi_id: 'lokasi-1',
                bulan: 1,
                tahun: 2026,
                created_at: new Date(),
                updated_at: new Date(),
                lokasi: { id: 'lokasi-1', nama_lokasi: 'Gedung WGS' },
            },
        ];
        mockDB.penugasanOb.findMany.mockResolvedValue(fakeAssignments as never);

        const data = await mockObRepo.getActiveAssignments(obId, 1, 2026);

        expect(mockDB.penugasanOb.findMany).toHaveBeenCalledWith({
            where: { ob_id: obId, bulan: 1, tahun: 2026 },
            include: { lokasi: true },
        });
        expect(data).toEqual(fakeAssignments);
    });
});
