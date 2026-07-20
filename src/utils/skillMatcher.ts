export interface SkillMatchInput {
    id: string;
    keyword: string[];
}

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function matchSkillIds(namaTugas: string, definitions: SkillMatchInput[]): string[] {
    const text = namaTugas.toLowerCase();
    const matched: string[] = [];

    for (const def of definitions) {
        const hasMatch = def.keyword.some(kw => {
            if (!kw) return false;
            const pattern = new RegExp(`\\b${escapeRegex(kw.toLowerCase())}\\b`, "i");
            return pattern.test(text);
        });
        if (hasMatch) matched.push(def.id);
    }

    return matched;
}
