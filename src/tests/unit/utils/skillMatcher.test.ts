import { describe, expect, it } from 'vitest';
import { matchSkillIds } from '../../../utils/skillMatcher.js';

const definitions = [
    { id: '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c', keyword: ['bersih', 'sapu'] },
    { id: 'f6e0481d-67d4-449b-b3dc-376e72bdcf28', keyword: ['pel', 'mengepel'] },
];

describe('matchSkillIds', () => {
    it('mengembalikan skill id yang keywordnya cocok', async () => {
        expect(matchSkillIds('Bersih kaca jendela', definitions)).toEqual([
            '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c',
        ]);
    });

    it('tidak peduli huruf besar atau kecil', async () => {
        expect(matchSkillIds('BERSIH LANTAI', definitions)).toEqual([
            '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c',
        ]);
    });

    it('mengembalikan array kosong jika tidak ada keyword yang cocok', async () => {
        expect(matchSkillIds('Perbaiki AC rusak', definitions)).toEqual([]);
    });

    it('tidak cocok sebagian kata tanpa word boundary', async () => {
        expect(matchSkillIds('membersihkan', definitions)).toEqual([]);
    });

    it('mengembalikan beberapa skill jika banyak keyword cocok', async () => {
        expect(matchSkillIds('Bersih dan pel lantai', definitions)).toEqual([
            '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c',
            'f6e0481d-67d4-449b-b3dc-376e72bdcf28',
        ]);
    });

    it('melewati keyword kosong', async () => {
        const defs = [{ id: 'skill-1', keyword: ['', 'bersih'] }];

        expect(matchSkillIds('Bersih kaca', defs)).toEqual(['skill-1']);
        expect(matchSkillIds('Tidak cocok', defs)).toEqual([]);
    });
});
