import { beforeEach, describe, expect, it } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient, ObSkill, SkillDefinition } from '../../../generated/prisma/client.js';
import { SkillRepository } from '../../../repositories/skill_repository.js';
import { ObCompletedTask } from '../../../repositories/skill_repository.interface.js';

const mockDB = mockDeep<PrismaClient>();
const mockSkillRepo = new SkillRepository(mockDB);

beforeEach(() => {
    mockReset(mockDB);
});

const skillId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';
const obId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
const adminId = '852a6e0e-1bcf-4578-b93b-46f893544bfc';

// Fungsi generate fake data dan bisa juga override
function createFakeSkillDefinition(overrides?: Partial<SkillDefinition>): SkillDefinition {
    return {
        id: '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c',
        nama_skill: 'Kebersihan Dasar',
        keyword: ['bersih', 'sapu'],
        deskripsi: 'Kemampuan membersihkan area dasar',
        is_auto: true,
        is_active: true,
        threshold: 5,
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}

// Fungsi generate fake data dan bisa juga override
function createFakeObSkill(overrides?: Partial<ObSkill>): ObSkill {
    return {
        id: 'b7c8d9e0-1f2a-4b3c-9d4e-5f6a7b8c9d0e',
        ob_id: 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2',
        skill_id: '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c',
        jumlah_selesai: 5,
        assigned_by: null,
        diperoleh_at: null,
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}

// Fungsi generate fake data dan bisa juga override
function createFakeObCompletedTask(overrides?: Partial<ObCompletedTask>): ObCompletedTask {
    return {
        ob_id: 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2',
        nama_tugas: 'Bersih kaca jendela',
        dikerjakan_at: new Date('2026-01-01T08:00:00Z'),
        selesai_at: new Date('2026-01-01T09:00:00Z'),
        ...overrides,
    };
}

describe('SkillRepository.createDefinition', () => {
    it('membuat skill definition dan mengembalikan data yang dibuat', async () => {
        const fakeDef = createFakeSkillDefinition();
        const req = {
            nama_skill: 'Kebersihan Dasar',
            keyword: ['bersih', 'sapu'],
            deskripsi: 'Kemampuan membersihkan area dasar',
            is_auto: true,
            threshold: 5,
            is_active: true,
        };

        mockDB.skillDefinition.create.mockResolvedValue(fakeDef);

        const data = await mockSkillRepo.createDefinition(req);

        expect(mockDB.skillDefinition.create).toHaveBeenCalledWith({ data: req });
        expect(data).toEqual(fakeDef);
    });
});

describe('SkillRepository.getDefinitionByID', () => {
    it('mengembalikan skill definition sesuai id yang dikirim', async () => {
        const fakeDef = createFakeSkillDefinition();
        mockDB.skillDefinition.findFirst.mockResolvedValue(fakeDef);

        const data = await mockSkillRepo.getDefinitionByID(fakeDef.id);

        expect(mockDB.skillDefinition.findFirst).toHaveBeenCalledWith({ where: { id: fakeDef.id } });
        expect(data).toEqual(fakeDef);
    });

    it('mengembalikan null jika skill definition tidak ditemukan', async () => {
        mockDB.skillDefinition.findFirst.mockResolvedValue(null);

        const data = await mockSkillRepo.getDefinitionByID('skill-not-exist');

        expect(data).toBeNull();
    });
});

describe('SkillRepository.getAllDefinitions', () => {
    it('mengembalikan semua skill definition yang aktif saja secara default', async () => {
        const fakeDefs = [createFakeSkillDefinition()];
        mockDB.skillDefinition.findMany.mockResolvedValue(fakeDefs);

        const data = await mockSkillRepo.getAllDefinitions();

        expect(mockDB.skillDefinition.findMany).toHaveBeenCalledWith({
            where: { is_active: true },
            orderBy: { created_at: 'desc' },
        });
        expect(data).toEqual(fakeDefs);
    });

    it('mengembalikan semua skill definition termasuk yang tidak aktif', async () => {
        const fakeDefs = [
            createFakeSkillDefinition(),
            createFakeSkillDefinition({
                id: 'f6e0481d-67d4-449b-b3dc-376e72bdcf28',
                nama_skill: 'Kebersihan Lanjutan',
                is_active: false,
            }),
        ];
        mockDB.skillDefinition.findMany.mockResolvedValue(fakeDefs);

        const data = await mockSkillRepo.getAllDefinitions(true);

        expect(mockDB.skillDefinition.findMany).toHaveBeenCalledWith({
            where: {},
            orderBy: { created_at: 'desc' },
        });
        expect(data).toEqual(fakeDefs);
    });
});

describe('SkillRepository.getActiveAutoDefinitions', () => {
    it('mengembalikan skill definition yang aktif dan otomatis', async () => {
        const fakeDefs = [createFakeSkillDefinition()];
        mockDB.skillDefinition.findMany.mockResolvedValue(fakeDefs);

        const data = await mockSkillRepo.getActiveAutoDefinitions();

        expect(mockDB.skillDefinition.findMany).toHaveBeenCalledWith({
            where: { is_active: true, is_auto: true },
        });
        expect(data).toEqual(fakeDefs);
    });
});

describe('SkillRepository.updateDefinition', () => {
    it('mengupdate skill definition sesuai id dan data yang dikirim', async () => {
        mockDB.skillDefinition.update.mockResolvedValue(createFakeSkillDefinition({ nama_skill: 'Kebersihan Lanjutan' }));

        await mockSkillRepo.updateDefinition(skillId, { nama_skill: 'Kebersihan Lanjutan' });

        expect(mockDB.skillDefinition.update).toHaveBeenCalledWith({
            where: { id: skillId },
            data: { nama_skill: 'Kebersihan Lanjutan' },
        });
    });
});

describe('SkillRepository.softDeleteDefinition', () => {
    it('menonaktifkan skill definition tanpa menghapus datanya', async () => {
        mockDB.skillDefinition.update.mockResolvedValue(createFakeSkillDefinition({ is_active: false }));

        await mockSkillRepo.softDeleteDefinition(skillId);

        expect(mockDB.skillDefinition.update).toHaveBeenCalledWith({
            where: { id: skillId },
            data: { is_active: false },
        });
    });
});

describe('SkillRepository.getObSkills', () => {
    it('mengembalikan semua skill milik OB beserta detail skill definition', async () => {
        const fakeObSkills = [createFakeObSkill()];
        mockDB.obSkill.findMany.mockResolvedValue(fakeObSkills);

        const data = await mockSkillRepo.getObSkills(obId);

        expect(mockDB.obSkill.findMany).toHaveBeenCalledWith({
            where: { ob_id: obId },
            include: { skill: true },
            orderBy: { created_at: 'desc' },
        });
        expect(data).toEqual(fakeObSkills);
    });
});

describe('SkillRepository.getAcquiredObSkills', () => {
    it('mengembalikan skill OB yang sudah diperoleh saja', async () => {
        const fakeObSkills = [createFakeObSkill({ diperoleh_at: new Date('2026-01-02T00:00:00Z') })];
        mockDB.obSkill.findMany.mockResolvedValue(fakeObSkills);

        const data = await mockSkillRepo.getAcquiredObSkills(obId);

        expect(mockDB.obSkill.findMany).toHaveBeenCalledWith({
            where: { ob_id: obId, diperoleh_at: { not: null } },
            include: { skill: true },
            orderBy: { diperoleh_at: 'desc' },
        });
        expect(data).toEqual(fakeObSkills);
    });
});

describe('SkillRepository.getObSkill', () => {
    it('mengembalikan skill milik OB sesuai skill id', async () => {
        const fakeObSkill = createFakeObSkill();
        mockDB.obSkill.findFirst.mockResolvedValue(fakeObSkill);

        const data = await mockSkillRepo.getObSkill(obId, skillId);

        expect(mockDB.obSkill.findFirst).toHaveBeenCalledWith({
            where: { ob_id: obId, skill_id: skillId },
        });
        expect(data).toEqual(fakeObSkill);
    });

    it('mengembalikan null jika OB belum punya skill tersebut', async () => {
        mockDB.obSkill.findFirst.mockResolvedValue(null);

        const data = await mockSkillRepo.getObSkill(obId, skillId);

        expect(data).toBeNull();
    });
});

describe('SkillRepository.assignSkill', () => {
    it('membuat data ob_skill baru jika OB belum punya skill tersebut', async () => {
        const fakeObSkill = createFakeObSkill({ assigned_by: adminId, diperoleh_at: new Date('2026-01-02T00:00:00Z') });
        mockDB.obSkill.upsert.mockResolvedValue(fakeObSkill);

        const data = await mockSkillRepo.assignSkill(obId, skillId, adminId);

        expect(mockDB.obSkill.upsert).toHaveBeenCalledWith({
            where: { ob_id_skill_id: { ob_id: obId, skill_id: skillId } },
            create: {
                ob_id: obId,
                skill_id: skillId,
                assigned_by: adminId,
                diperoleh_at: expect.any(Date),
            },
            update: {
                assigned_by: adminId,
                diperoleh_at: expect.any(Date),
            },
        });
        expect(data).toEqual(fakeObSkill);
    });

    it('menugaskan skill dengan assigned_by null jika ditugaskan oleh sistem', async () => {
        const fakeObSkill = createFakeObSkill();
        mockDB.obSkill.upsert.mockResolvedValue(fakeObSkill);

        const data = await mockSkillRepo.assignSkill(obId, skillId, null);

        expect(mockDB.obSkill.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                create: expect.objectContaining({ assigned_by: null }),
                update: expect.objectContaining({ assigned_by: null }),
            })
        );
        expect(data).toEqual(fakeObSkill);
    });
});

describe('SkillRepository.incrementCounter', () => {
    it('menaikkan jumlah_selesai sebanyak satu', async () => {
        const fakeObSkill = createFakeObSkill({ jumlah_selesai: 3 });
        mockDB.obSkill.upsert.mockResolvedValue(fakeObSkill);

        const data = await mockSkillRepo.incrementCounter(obId, skillId);

        expect(mockDB.obSkill.upsert).toHaveBeenCalledWith({
            where: { ob_id_skill_id: { ob_id: obId, skill_id: skillId } },
            create: {
                ob_id: obId,
                skill_id: skillId,
                jumlah_selesai: 1,
                assigned_by: null,
            },
            update: {
                jumlah_selesai: { increment: 1 },
            },
        });
        expect(data).toEqual(fakeObSkill);
    });
});

describe('SkillRepository.markUnlocked', () => {
    it('mengisi diperoleh_at sebagai tanda skill sudah didapatkan', async () => {
        mockDB.obSkill.update.mockResolvedValue(createFakeObSkill({ diperoleh_at: new Date('2026-01-02T00:00:00Z') }));

        await mockSkillRepo.markUnlocked(obId, skillId);

        expect(mockDB.obSkill.update).toHaveBeenCalledWith({
            where: { ob_id_skill_id: { ob_id: obId, skill_id: skillId } },
            data: { diperoleh_at: expect.any(Date) },
        });
    });
});

describe('SkillRepository.getCompletedTasks', () => {
    it('mengembalikan tugas selesai dari semua OB tanpa filter', async () => {
        const fakeTasks = [createFakeObCompletedTask()];
        mockDB.$queryRawUnsafe.mockResolvedValue(fakeTasks);

        const data = await mockSkillRepo.getCompletedTasks();

        expect(mockDB.$queryRawUnsafe).toHaveBeenCalledWith(expect.not.stringContaining('$1::uuid'));
        expect(data).toEqual(fakeTasks);
    });

    it('mengembalikan tugas selesai milik satu OB saja', async () => {
        const fakeTasks = [createFakeObCompletedTask()];
        mockDB.$queryRawUnsafe.mockResolvedValue(fakeTasks);

        const data = await mockSkillRepo.getCompletedTasks(obId);

        expect(mockDB.$queryRawUnsafe).toHaveBeenCalledWith(expect.stringContaining('AND ob_id = $1::uuid'), obId);
        expect(data).toEqual(fakeTasks);
    });
});

describe('SkillRepository.upsertSkillProgress', () => {
    it('menyimpan jumlah selesai terbaru milik OB', async () => {
        const fakeObSkill = createFakeObSkill({ jumlah_selesai: 4 });
        mockDB.obSkill.upsert.mockResolvedValue(fakeObSkill);

        const data = await mockSkillRepo.upsertSkillProgress(obId, skillId, 4);

        expect(mockDB.obSkill.upsert).toHaveBeenCalledWith({
            where: { ob_id_skill_id: { ob_id: obId, skill_id: skillId } },
            create: {
                ob_id: obId,
                skill_id: skillId,
                jumlah_selesai: 4,
                assigned_by: null,
            },
            update: {
                jumlah_selesai: 4,
            },
        });
        expect(data).toEqual(fakeObSkill);
    });
});
