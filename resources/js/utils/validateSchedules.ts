import { type WorkDayTime } from '@/components/work-days-selector';

// Validate that no two non-college roles have overlapping time ranges on the same day.
// Allows end-to-start adjacency (e.g., 08:00–13:00 and 13:00–17:00).
export function validateNoCrossRoleOverlap(work_days: Record<string, WorkDayTime[] | undefined>): { ok: true } | { ok: false; msg: string } {

    const toMin = (hhmm: string) => {
        const [h, m] = String(hhmm || '0:0').split(':').map(n => Number(n));
        const hN = Number.isFinite(h) ? h : 0;
        const mN = Number.isFinite(m) ? m : 0;
        return hN * 60 + mN;
    };

    const splitRange = (startMin: number, endMin: number): Array<{ s: number; e: number }> => {
        // Overnight support: treat end <= start as crossing midnight
        if (endMin <= startMin) {
            return [
                { s: startMin, e: 24 * 60 },
                { s: 0, e: endMin },
            ];
        }
        return [{ s: startMin, e: endMin }];
    };

    const rangesOverlap = (a: { s: number; e: number }, b: { s: number; e: number }) => Math.max(a.s, b.s) < Math.min(a.e, b.e);

    if (!work_days || typeof work_days !== 'object') return { ok: true };

    // Filter to non-college roles only
    const roles = Object.keys(work_days).filter(r => !r.toLowerCase().includes('college'));

    // Build a per-day list of segments, annotated with role
    const byDay: Record<string, Array<{ role: string; segs: Array<{ s: number; e: number }> }>> = {};
    for (const role of roles) {
        const list = work_days[role] || [];
        for (const d of list) {
            if (!d?.day || !d.work_start_time || !d.work_end_time) continue;
            const s = toMin(d.work_start_time);
            const e = toMin(d.work_end_time);
            const segs = splitRange(s, e);
            (byDay[d.day] ||= []).push({ role, segs });
        }
    }

    // For each day, compare every pair of roles' segments
    for (const [, entries] of Object.entries(byDay)) {
        for (let i = 0; i < entries.length; i++) {
            for (let j = i + 1; j < entries.length; j++) {
                const A = entries[i];
                const B = entries[j];
                if (A.role === B.role) continue; // same role can overlap with itself (handled elsewhere if needed)
                for (const a of A.segs) {
                    for (const b of B.segs) {
                        if (rangesOverlap(a, b)) {
                            return { ok: false, msg: `Schedules for roles "${A.role}" and "${B.role}" overlap. Please adjust times so they don't overlap.` };
                        }
                    }
                }
            }
        }
    }

    return { ok: true };
}
