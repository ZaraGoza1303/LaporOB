import { beforeEach, describe, expect, it } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient, ObSkill, SkillDefinition } from "../../../generated/prisma/client";
import { SkillRepository } from "../../../repositories/skill_repository";
import { SkillService } from "../../../services/skill_service";
import type { INotificationService } from "../../../services/notification_service.interface";
import type { ObCompletedTask } from "../../../repositories/skill_repository.interface";
import type { AssignSkillReq, CreateSkillDefinitionReq, UpdateSkillDefinitionReq } from "../../../dto/skill";
import { AppError } from "../../../utils/error";

const mockDB = mockDeep<PrismaClient>();
const mockNotificationService = mockDeep<INotificationService>();

const mockSkillRepo = new SkillRepository(mockDB);
const mockSkillService = new SkillService(mockSkillRepo, mockNotificationService);

beforeEach(() => {
    mockReset(mockDB);
    mockReset(mockNotificationService);
});

const skillId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';
const obId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
const adminId = '852a6e0e-1bcf-4578-b93b-46f893544bfc';

// Fungsi generate fake data dan bisa juga override
function createFakeSkillDefinition(overrides?: Partial<SkillDefinition>): SkillDefinition {
    return {
        id: skillId,
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
        ob_id: obId,
        skill_id: skillId,
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
        ob_id: obId,
        nama_tugas: 'Bersih kaca jendela',
        dikerjakan_at: new Date('2026-01-01T08:00:00Z'),
        selesai_at: new Date('2026-01-01T09:00:00Z'),
        ...overrides,
    };
}

// Fungsi generate fake data dan bisa juga override
function createFakeCreateReq(overrides?: Partial<CreateSkillDefinitionReq>): CreateSkillDefinitionReq {
    return {
        nama_skill: 'Kebersihan Dasar',
        keyword: ['bersih', 'sapu'],
        is_auto: true,
        threshold: 5,
        ...overrides,
    };
}

describe('SkillService.createDefinition', () => {
    it('membuat skill definition baru dan mengembalikan hasil mapping', async () => {
        const fakeDef = createFakeSkillDefinition();
        mockDB.skillDefinition.create.mockResolvedValue(fakeDef);

        const data = await mockSkillService.createDefinition(createFakeCreateReq());

        expect(mockDB.skillDefinition.create).toHaveBeenCalledWith({
            data: {
                nama_skill: 'Kebersihan Dasar',
                keyword: ['bersih', 'sapu'],
                deskripsi: null,
                is_auto: true,
                threshold: 5,
                is_active: true,
            },
        });
        expect(data).toEqual({
            id: fakeDef.id,
            nama_skill: fakeDef.nama_skill,
            keyword: fakeDef.keyword,
            deskripsi: fakeDef.deskripsi,
            is_auto: fakeDef.is_auto,
            is_active: fakeDef.is_active,
            threshold: fakeDef.threshold,
            created_at: fakeDef.created_at,
            updated_at: fakeDef.updated_at,
        });
    });

    it('mengirim deskripsi dari request jika diisi', async () => {
        const fakeDef = createFakeSkillDefinition({ deskripsi: 'Kemampuan mengepel' });
        mockDB.skillDefinition.create.mockResolvedValue(fakeDef);

        await mockSkillService.createDefinition(createFakeCreateReq({ deskripsi: 'Kemampuan mengepel' }));

        expect(mockDB.skillDefinition.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ deskripsi: 'Kemampuan mengepel' }),
        });
    });

    it('meneruskan error dari repository', async () => {
        mockDB.skillDefinition.create.mockRejectedValue(new Error('boom'));

        await expect(mockSkillService.createDefinition(createFakeCreateReq())).rejects.toThrow('boom');
    });
});

describe('SkillService.getDefinitionByID', () => {
    it('mengembalikan detail skill definition', async () => {
        const fakeDef = createFakeSkillDefinition();
        mockDB.skillDefinition.findFirst.mockResolvedValue(fakeDef);

        const data = await mockSkillService.getDefinitionByID(skillId);

        expect(mockDB.skillDefinition.findFirst).toHaveBeenCalledWith({ where: { id: skillId } });
        expect(data?.nama_skill).toBe('Kebersihan Dasar');
        expect(data?.threshold).toBe(5);
    });

    it('mengembalikan null jika skill definition tidak ditemukan', async () => {
        mockDB.skillDefinition.findFirst.mockResolvedValue(null);

        const data = await mockSkillService.getDefinitionByID('skill-not-exist');

        expect(data).toBeNull();
    });
});

describe('SkillService.getAllDefinitions', () => {
    it('mengembalikan daftar skill definition aktif saja', async () => {
        mockDB.skillDefinition.findMany.mockResolvedValue([createFakeSkillDefinition()]);

        const data = await mockSkillService.getAllDefinitions(false);

        expect(mockDB.skillDefinition.findMany).toHaveBeenCalledWith({
            where: { is_active: true },
            orderBy: { created_at: 'desc' },
        });
        expect(data).toHaveLength(1);
    });

    it('mengembalikan seluruh skill definition termasuk yang tidak aktif', async () => {
        const fakeDefs = [
            createFakeSkillDefinition(),
            createFakeSkillDefinition({ id: 'f6e0481d-67d4-449b-b3dc-376e72bdcf28', is_active: false }),
        ];
        mockDB.skillDefinition.findMany.mockResolvedValue(fakeDefs);

        const data = await mockSkillService.getAllDefinitions(true);

        expect(mockDB.skillDefinition.findMany).toHaveBeenCalledWith({
            where: {},
            orderBy: { created_at: 'desc' },
        });
        expect(data).toHaveLength(2);
    });
});

describe('SkillService.updateDefinition', () => {
    it('hanya mengirim field yang diisi ke repository', async () => {
        const req: UpdateSkillDefinitionReq = {
            nama_skill: 'Kebersihan Lanjutan',
            threshold: 10,
        };

        await mockSkillService.updateDefinition(skillId, req);

        expect(mockDB.skillDefinition.update).toHaveBeenCalledWith({
            where: { id: skillId },
            data: { nama_skill: 'Kebersihan Lanjutan', threshold: 10 },
        });
    });

    it('mengirim semua field yang diisi termasuk deskripsi null dan is_active', async () => {
        const req: UpdateSkillDefinitionReq = {
            nama_skill: 'Kebersihan Lanjutan',
            keyword: ['pel', 'bersih'],
            deskripsi: null,
            is_auto: false,
            is_active: false,
            threshold: 3,
        };

        await mockSkillService.updateDefinition(skillId, req);

        expect(mockDB.skillDefinition.update).toHaveBeenCalledWith({
            where: { id: skillId },
            data: {
                nama_skill: 'Kebersihan Lanjutan',
                keyword: ['pel', 'bersih'],
                deskripsi: null,
                is_auto: false,
                is_active: false,
                threshold: 3,
            },
        });
    });

    it('tidak mengirim data apa pun jika request kosong', async () => {
        await mockSkillService.updateDefinition(skillId, {});

        expect(mockDB.skillDefinition.update).toHaveBeenCalledWith({
            where: { id: skillId },
            data: {},
        });
    });
});

describe('SkillService.deleteDefinition', () => {
    it('menonaktifkan skill definition tanpa menghapus datanya', async () => {
        await mockSkillService.deleteDefinition(skillId);

        expect(mockDB.skillDefinition.update).toHaveBeenCalledWith({
            where: { id: skillId },
            data: { is_active: false },
        });
    });
});

describe('SkillService.assignSkillToOb', () => {
    it('menugaskan skill ke OB dan mengirim notifikasi ke OB', async () => {
        const fakeDef = createFakeSkillDefinition();
        const fakeObSkill = createFakeObSkill({
            assigned_by: adminId,
            diperoleh_at: new Date('2026-01-02T00:00:00Z'),
        });
        const req: AssignSkillReq = { ob_id: obId, skill_id: skillId };

        mockDB.skillDefinition.findFirst.mockResolvedValue(fakeDef);
        mockDB.obSkill.upsert.mockResolvedValue(fakeObSkill);

        const data = await mockSkillService.assignSkillToOb(req, adminId);

        expect(mockDB.obSkill.upsert).toHaveBeenCalledWith({
            where: { ob_id_skill_id: { ob_id: obId, skill_id: skillId } },
            create: expect.objectContaining({ assigned_by: adminId, diperoleh_at: expect.any(Date) }),
            update: expect.objectContaining({ assigned_by: adminId, diperoleh_at: expect.any(Date) }),
        });
        expect(mockNotificationService.sendBulkNotification).toHaveBeenCalledWith({
            penerima_ids: [obId],
            pengirim_id: adminId,
            tipe: 'SKILL_DI_PEROLEH',
            judul: 'Skill baru diperoleh',
            pesan: 'Selamat! Anda memperoleh skill baru: Kebersihan Dasar',
            ref_tipe: 'SKILL',
        });
        expect(data).toEqual({
            id: fakeObSkill.id,
            skill_id: fakeObSkill.skill_id,
            nama_skill: fakeDef.nama_skill,
            keyword: fakeDef.keyword,
            deskripsi: fakeDef.deskripsi,
            jumlah_selesai: fakeObSkill.jumlah_selesai,
            assigned_by: fakeObSkill.assigned_by,
            diperoleh_at: fakeObSkill.diperoleh_at,
            created_at: fakeObSkill.created_at,
            updated_at: fakeObSkill.updated_at,
        });
    });

    it('melempar AppError dan tidak mengirim notifikasi jika skill definition tidak ditemukan', async () => {
        const req: AssignSkillReq = { ob_id: obId, skill_id: skillId };
        mockDB.skillDefinition.findFirst.mockResolvedValue(null);

        await expect(mockSkillService.assignSkillToOb(req, adminId)).rejects.toThrow(AppError);
        expect(mockNotificationService.sendBulkNotification).not.toHaveBeenCalled();
    });
});

describe('SkillService.getObSkills', () => {
    it('mengembalikan daftar skill milik OB beserta detail skill definition', async () => {
        const fakeDef = createFakeSkillDefinition();
        const fakeObSkill = createFakeObSkill();

        mockDB.obSkill.findMany.mockResolvedValue([fakeObSkill]);
        mockDB.skillDefinition.findFirst.mockResolvedValue(fakeDef);

        const data = await mockSkillService.getObSkills(obId);

        expect(mockDB.obSkill.findMany).toHaveBeenCalledWith({
            where: { ob_id: obId },
            include: { skill: true },
            orderBy: { created_at: 'desc' },
        });
        expect(data).toHaveLength(1);
        expect(data[0]).toEqual({
            id: fakeObSkill.id,
            skill_id: fakeObSkill.skill_id,
            nama_skill: fakeDef.nama_skill,
            keyword: fakeDef.keyword,
            deskripsi: fakeDef.deskripsi,
            jumlah_selesai: fakeObSkill.jumlah_selesai,
            assigned_by: fakeObSkill.assigned_by,
            diperoleh_at: fakeObSkill.diperoleh_at,
            created_at: fakeObSkill.created_at,
            updated_at: fakeObSkill.updated_at,
        });
    });

    it('melewati skill yang definisinya sudah tidak ada', async () => {
        mockDB.obSkill.findMany.mockResolvedValue([
            createFakeObSkill(),
            createFakeObSkill({ id: 'ob-skill-2', skill_id: 'f6e0481d-67d4-449b-b3dc-376e72bdcf28' }),
        ]);
        mockDB.skillDefinition.findFirst
            .mockResolvedValueOnce(createFakeSkillDefinition())
            .mockResolvedValueOnce(null);

        const data = await mockSkillService.getObSkills(obId);

        expect(data).toHaveLength(1);
        expect(data[0]?.skill_id).toBe(skillId);
    });
});

describe('SkillService.getAcquiredObSkills', () => {
    it('mengembalikan skill OB yang sudah diperoleh beserta detail skill definition', async () => {
        const fakeDef = createFakeSkillDefinition();
        const fakeObSkill = createFakeObSkill({ diperoleh_at: new Date('2026-01-02T00:00:00Z') });

        mockDB.obSkill.findMany.mockResolvedValue([fakeObSkill]);
        mockDB.skillDefinition.findFirst.mockResolvedValue(fakeDef);

        const data = await mockSkillService.getAcquiredObSkills(obId);

        expect(mockDB.obSkill.findMany).toHaveBeenCalledWith({
            where: { ob_id: obId, diperoleh_at: { not: null } },
            include: { skill: true },
            orderBy: { diperoleh_at: 'desc' },
        });
        expect(data).toHaveLength(1);
        expect(data[0]?.diperoleh_at).toEqual(fakeObSkill.diperoleh_at);
    });
});

describe('SkillService.prosesSkillOtomatis', () => {
    it('mengembalikan 0 jika tidak ada skill definition otomatis', async () => {
        mockDB.skillDefinition.findMany.mockResolvedValue([]);

        const data = await mockSkillService.prosesSkillOtomatis();

        expect(mockDB.skillDefinition.findMany).toHaveBeenCalledWith({
            where: { is_active: true, is_auto: true },
        });
        expect(mockDB.$queryRawUnsafe).not.toHaveBeenCalled();
        expect(data).toBe(0);
    });

    it('mengembalikan 0 jika tidak ada tugas selesai', async () => {
        mockDB.skillDefinition.findMany.mockResolvedValue([createFakeSkillDefinition({ threshold: 2 })]);
        mockDB.$queryRawUnsafe.mockResolvedValue([]);

        const data = await mockSkillService.prosesSkillOtomatis();

        expect(mockDB.obSkill.upsert).not.toHaveBeenCalled();
        expect(data).toBe(0);
    });

    it('membuka skill dan mengirim notifikasi jika jumlah tugas memenuhi threshold', async () => {
        const fakeDef = createFakeSkillDefinition({ keyword: ['bersih'], threshold: 2 });
        const fakeTasks = [
            createFakeObCompletedTask({ nama_tugas: 'Bersih kaca jendela' }),
            createFakeObCompletedTask({ nama_tugas: 'Bersih lantai ruang tamu' }),
        ];

        mockDB.skillDefinition.findMany.mockResolvedValue([fakeDef]);
        mockDB.$queryRawUnsafe.mockResolvedValue(fakeTasks);
        mockDB.obSkill.upsert.mockResolvedValue(createFakeObSkill({ jumlah_selesai: 2, diperoleh_at: null }));

        const data = await mockSkillService.prosesSkillOtomatis();

        expect(mockDB.obSkill.upsert).toHaveBeenCalledWith({
            where: { ob_id_skill_id: { ob_id: obId, skill_id: skillId } },
            create: expect.objectContaining({ jumlah_selesai: 2 }),
            update: { jumlah_selesai: 2 },
        });
        expect(mockDB.obSkill.update).toHaveBeenCalledWith({
            where: { ob_id_skill_id: { ob_id: obId, skill_id: skillId } },
            data: { diperoleh_at: expect.any(Date) },
        });
        expect(mockNotificationService.sendBulkNotification).toHaveBeenCalledWith({
            penerima_ids: [obId],
            pengirim_id: null,
            tipe: 'SKILL_DI_PEROLEH',
            judul: 'Skill baru diperoleh',
            pesan: 'Selamat! Anda memperoleh skill baru: Kebersihan Dasar',
            ref_tipe: 'SKILL',
        });
        expect(data).toBe(1);
    });

    it('tidak membuka skill jika jumlah tugas belum memenuhi threshold', async () => {
        const fakeDef = createFakeSkillDefinition({ keyword: ['bersih'], threshold: 2 });

        mockDB.skillDefinition.findMany.mockResolvedValue([fakeDef]);
        mockDB.$queryRawUnsafe.mockResolvedValue([createFakeObCompletedTask({ nama_tugas: 'Bersih kaca jendela' })]);
        mockDB.obSkill.upsert.mockResolvedValue(createFakeObSkill({ jumlah_selesai: 1, diperoleh_at: null }));

        const data = await mockSkillService.prosesSkillOtomatis();

        expect(mockDB.obSkill.update).not.toHaveBeenCalled();
        expect(mockNotificationService.sendBulkNotification).not.toHaveBeenCalled();
        expect(data).toBe(0);
    });

    it('tidak membuka skill lagi jika skill sudah pernah diperoleh', async () => {
        const fakeDef = createFakeSkillDefinition({ keyword: ['bersih'], threshold: 1 });

        mockDB.skillDefinition.findMany.mockResolvedValue([fakeDef]);
        mockDB.$queryRawUnsafe.mockResolvedValue([createFakeObCompletedTask({ nama_tugas: 'Bersih kaca jendela' })]);
        mockDB.obSkill.upsert.mockResolvedValue(
            createFakeObSkill({ jumlah_selesai: 3, diperoleh_at: new Date('2026-01-02T00:00:00Z') })
        );

        const data = await mockSkillService.prosesSkillOtomatis();

        expect(mockDB.obSkill.update).not.toHaveBeenCalled();
        expect(mockNotificationService.sendBulkNotification).not.toHaveBeenCalled();
        expect(data).toBe(0);
    });
});

describe('SkillService.prosesSkillOtomatisForOb', () => {
    it('hanya memproses tugas selesai milik satu OB', async () => {
        const fakeDef = createFakeSkillDefinition({ keyword: ['bersih'], threshold: 1 });

        mockDB.skillDefinition.findMany.mockResolvedValue([fakeDef]);
        mockDB.$queryRawUnsafe.mockResolvedValue([createFakeObCompletedTask({ nama_tugas: 'Bersih kaca jendela' })]);
        mockDB.obSkill.upsert.mockResolvedValue(createFakeObSkill({ jumlah_selesai: 1, diperoleh_at: null }));

        const data = await mockSkillService.prosesSkillOtomatisForOb(obId);

        expect(mockDB.$queryRawUnsafe).toHaveBeenCalledWith(expect.stringContaining('AND ob_id = $1::uuid'), obId);
        expect(mockNotificationService.sendBulkNotification).toHaveBeenCalledTimes(1);
        expect(data).toBe(1);
    });
});
