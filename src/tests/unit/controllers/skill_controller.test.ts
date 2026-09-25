import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { Request, Response } from "express";
import { SkillController } from "../../../controllers/skill_controller";
import type { ISkillService } from "../../../services/skill_service.interface";
import type { ObSkillRes, SkillDefinitionRes } from "../../../types/skill";
import { AppError } from "../../../utils/error";

const mockSkillService = mockDeep<ISkillService>();

const skillController = new SkillController(mockSkillService);

beforeEach(() => {
    mockReset(mockSkillService);
});

const skillId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';
const obId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
const adminId = '852a6e0e-1bcf-4578-b93b-46f893544bfc';

const mockSkillDefinitionRes: SkillDefinitionRes = {
    id: skillId,
    nama_skill: 'Kebersihan Dasar',
    keyword: ['bersih', 'sapu'],
    deskripsi: 'Kemampuan membersihkan area dasar',
    is_auto: true,
    is_active: true,
    threshold: 5,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
};

const mockObSkillRes: ObSkillRes = {
    id: 'b7c8d9e0-1f2a-4b3c-9d4e-5f6a7b8c9d0e',
    skill_id: skillId,
    nama_skill: 'Kebersihan Dasar',
    keyword: ['bersih', 'sapu'],
    deskripsi: 'Kemampuan membersihkan area dasar',
    jumlah_selesai: 5,
    assigned_by: adminId,
    diperoleh_at: new Date('2026-01-02T00:00:00Z'),
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
};

// Fake req/res express.
function createFakeReq(overrides?: {
    query?: Record<string, unknown>;
    params?: Record<string, string>;
    body?: Record<string, unknown>;
    user?: { id: string; username: string; role: string };
}) {
    return { query: {}, params: {}, body: {}, ...overrides } as unknown as Request;
}

function createSuccessfullRes(data?: unknown) {
    return {
        success: true,
        message: expect.any(String),
        data: data,
    }
}

function createFailedRes(payload?: { errorMsg: Record<string, Array<string>> }) {
    return {
        errors: payload?.errorMsg,
        success: false,
        message: expect.any(String),
    }
}

function createFakeRes() {
    return {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    } as unknown as Response;
}

describe('SkillController.createDefinition', () => {
    it('mengembalikan data skill definition dengan response 201', async () => {
        mockSkillService.createDefinition.mockResolvedValue(mockSkillDefinitionRes);

        const res = createFakeRes();
        await skillController.createDefinition(createFakeReq({ body: { nama_skill: 'Kebersihan Dasar' } }), res);

        expect(mockSkillService.createDefinition).toHaveBeenCalledWith({
            nama_skill: 'Kebersihan Dasar',
            keyword: [],
            is_auto: true,
            threshold: 5,
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(mockSkillDefinitionRes));
    });

    it('meneruskan keyword, deskripsi, is_auto, dan threshold hasil validasi ke service', async () => {
        mockSkillService.createDefinition.mockResolvedValue(mockSkillDefinitionRes);

        const res = createFakeRes();
        await skillController.createDefinition(
            createFakeReq({
                body: {
                    nama_skill: 'Kebersihan Dasar',
                    keyword: ['bersih', 'sapu'],
                    deskripsi: 'Kemampuan membersihkan area dasar',
                    is_auto: false,
                    threshold: '3',
                },
            }),
            res
        );

        expect(mockSkillService.createDefinition).toHaveBeenCalledWith({
            nama_skill: 'Kebersihan Dasar',
            keyword: ['bersih', 'sapu'],
            deskripsi: 'Kemampuan membersihkan area dasar',
            is_auto: false,
            threshold: 3,
        });
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('mengembalikan 400 dan tidak memanggil service jika body tidak valid', async () => {
        const res = createFakeRes();
        await skillController.createDefinition(createFakeReq({ body: { nama_skill: '' } }), res);

        expect(mockSkillService.createDefinition).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "nama_skill": ["Nama skill wajib diisi"] } })
        );
    });

    it('mengembalikan 400 dan tidak memanggil service jika request body kosong', async () => {
        const res = createFakeRes();
        await skillController.createDefinition(createFakeReq({ body: undefined }), res);

        expect(mockSkillService.createDefinition).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('meneruskan status code AppError dari service', async () => {
        mockSkillService.createDefinition.mockRejectedValue(new AppError('Data sudah ada', 409));

        const res = createFakeRes();
        await skillController.createDefinition(createFakeReq({ body: { nama_skill: 'Kebersihan Dasar' } }), res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockSkillService.createDefinition.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await skillController.createDefinition(createFakeReq({ body: { nama_skill: 'Kebersihan Dasar' } }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('SkillController.getAllDefinitions', () => {
    it('mengembalikan daftar skill dengan response 200', async () => {
        mockSkillService.getAllDefinitions.mockResolvedValue([mockSkillDefinitionRes]);

        const res = createFakeRes();
        await skillController.getAllDefinitions(createFakeReq(), res);

        expect(mockSkillService.getAllDefinitions).toHaveBeenCalledWith(false);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes([mockSkillDefinitionRes]));
    });

    it('meneruskan include_inactive true ke service', async () => {
        mockSkillService.getAllDefinitions.mockResolvedValue([mockSkillDefinitionRes]);

        const res = createFakeRes();
        await skillController.getAllDefinitions(createFakeReq({ query: { include_inactive: 'true' } }), res);

        expect(mockSkillService.getAllDefinitions).toHaveBeenCalledWith(true);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockSkillService.getAllDefinitions.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await skillController.getAllDefinitions(createFakeReq(), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('SkillController.getDefinitionByID', () => {
    it('mengembalikan detail skill definition dengan response 200', async () => {
        mockSkillService.getDefinitionByID.mockResolvedValue(mockSkillDefinitionRes);

        const res = createFakeRes();
        await skillController.getDefinitionByID(createFakeReq({ params: { skill_id: skillId } }), res);

        expect(mockSkillService.getDefinitionByID).toHaveBeenCalledWith(skillId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(mockSkillDefinitionRes));
    });

    it('mengembalikan 400 dan tidak memanggil service jika skill_id bukan uuid', async () => {
        const res = createFakeRes();
        await skillController.getDefinitionByID(createFakeReq({ params: { skill_id: 'bukan-uuid' } }), res);

        expect(mockSkillService.getDefinitionByID).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "skill_id": ["Format skill_id harus UUID yang valid"] } })
        );
    });

    it('mengembalikan 404 jika skill definition tidak ditemukan', async () => {
        mockSkillService.getDefinitionByID.mockResolvedValue(null);

        const res = createFakeRes();
        await skillController.getDefinitionByID(createFakeReq({ params: { skill_id: skillId } }), res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockSkillService.getDefinitionByID.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await skillController.getDefinitionByID(createFakeReq({ params: { skill_id: skillId } }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('SkillController.updateDefinition', () => {
    it('mengembalikan response 200 dan meneruskan data hasil validasi ke service', async () => {
        const res = createFakeRes();
        await skillController.updateDefinition(
            createFakeReq({
                params: { skill_id: skillId },
                body: { nama_skill: 'Kebersihan Lanjutan', threshold: '7' },
            }),
            res
        );

        expect(mockSkillService.updateDefinition).toHaveBeenCalledWith(skillId, {
            nama_skill: 'Kebersihan Lanjutan',
            threshold: 7,
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes());
    });

    it('mengembalikan 400 dan tidak memanggil service jika skill_id bukan uuid', async () => {
        const res = createFakeRes();
        await skillController.updateDefinition(
            createFakeReq({ params: { skill_id: 'bukan-uuid' }, body: { nama_skill: 'Kebersihan Lanjutan' } }),
            res
        );

        expect(mockSkillService.updateDefinition).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "skill_id": ["Format skill_id harus UUID yang valid"] } })
        );
    });

    it('mengembalikan 400 dan tidak memanggil service jika body tidak valid', async () => {
        const res = createFakeRes();
        await skillController.updateDefinition(
            createFakeReq({ params: { skill_id: skillId }, body: { nama_skill: '' } }),
            res
        );

        expect(mockSkillService.updateDefinition).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: false, message: "Validation Failed" })
        );
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockSkillService.updateDefinition.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await skillController.updateDefinition(
            createFakeReq({ params: { skill_id: skillId }, body: { nama_skill: 'Kebersihan Lanjutan' } }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('SkillController.deleteDefinition', () => {
    it('mengembalikan response 200 setelah berhasil menghapus skill definition', async () => {
        const res = createFakeRes();
        await skillController.deleteDefinition(createFakeReq({ params: { skill_id: skillId } }), res);

        expect(mockSkillService.deleteDefinition).toHaveBeenCalledWith(skillId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes());
    });

    it('mengembalikan 400 dan tidak memanggil service jika skill_id bukan uuid', async () => {
        const res = createFakeRes();
        await skillController.deleteDefinition(createFakeReq({ params: { skill_id: 'bukan-uuid' } }), res);

        expect(mockSkillService.deleteDefinition).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "skill_id": ["Format skill_id harus UUID yang valid"] } })
        );
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockSkillService.deleteDefinition.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await skillController.deleteDefinition(createFakeReq({ params: { skill_id: skillId } }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('SkillController.assignSkill', () => {
    it('mengembalikan data skill OB dengan response 200', async () => {
        mockSkillService.assignSkillToOb.mockResolvedValue(mockObSkillRes);

        const res = createFakeRes();
        await skillController.assignSkill(
            createFakeReq({
                body: { ob_id: obId, skill_id: skillId },
                user: { id: adminId, username: 'admin_keren', role: 'admin' },
            }),
            res
        );

        expect(mockSkillService.assignSkillToOb).toHaveBeenCalledWith({ ob_id: obId, skill_id: skillId }, adminId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(mockObSkillRes));
    });

    it('mengembalikan 400 dan tidak memanggil service jika body tidak valid', async () => {
        const res = createFakeRes();
        await skillController.assignSkill(
            createFakeReq({
                body: { ob_id: 'bukan-uuid', skill_id: skillId },
                user: { id: adminId, username: 'admin_keren', role: 'admin' },
            }),
            res
        );

        expect(mockSkillService.assignSkillToOb).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "ob_id": ["Format ob_id harus berupa UUID yang valid"] } })
        );
    });

    it('mengembalikan 401 dan tidak memanggil service jika user tidak terautentikasi', async () => {
        const res = createFakeRes();
        await skillController.assignSkill(createFakeReq({ body: { ob_id: obId, skill_id: skillId } }), res);

        expect(mockSkillService.assignSkillToOb).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockSkillService.assignSkillToOb.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await skillController.assignSkill(
            createFakeReq({
                body: { ob_id: obId, skill_id: skillId },
                user: { id: adminId, username: 'admin_keren', role: 'admin' },
            }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('SkillController.getObSkills', () => {
    it('mengembalikan data skill milik OB dengan response 200', async () => {
        mockSkillService.getObSkills.mockResolvedValue([mockObSkillRes]);

        const res = createFakeRes();
        await skillController.getObSkills(createFakeReq({ params: { ob_id: obId } }), res);

        expect(mockSkillService.getObSkills).toHaveBeenCalledWith(obId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes([mockObSkillRes]));
    });

    it('mengembalikan 400 dan tidak memanggil service jika ob_id kosong', async () => {
        const res = createFakeRes();
        await skillController.getObSkills(createFakeReq(), res);

        expect(mockSkillService.getObSkills).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockSkillService.getObSkills.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await skillController.getObSkills(createFakeReq({ params: { ob_id: obId } }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('SkillController.getMySkills', () => {
    it('mengembalikan data skill milik user yang login dengan response 200', async () => {
        mockSkillService.getObSkills.mockResolvedValue([mockObSkillRes]);

        const res = createFakeRes();
        await skillController.getMySkills(
            createFakeReq({ user: { id: obId, username: 'farhan_ob', role: 'ob' } }),
            res
        );

        expect(mockSkillService.getObSkills).toHaveBeenCalledWith(obId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes([mockObSkillRes]));
    });

    it('mengembalikan 401 dan tidak memanggil service jika user tidak terautentikasi', async () => {
        const res = createFakeRes();
        await skillController.getMySkills(createFakeReq(), res);

        expect(mockSkillService.getObSkills).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockSkillService.getObSkills.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await skillController.getMySkills(
            createFakeReq({ user: { id: obId, username: 'farhan_ob', role: 'ob' } }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});
