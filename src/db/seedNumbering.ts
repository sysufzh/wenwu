import { getDb } from './index';

// 历史已用号一次性占位：墓葬 M1–M22、灰坑 H1–H71、柱洞 D1–D300、灶 Z1–Z3、烧土遗迹 S1–S5，
// 状态「占号」、信息留白，之后再填写。
export function seedNumberingPlaceholders() {
  const db = getDb();
  const count = db.prepare(`SELECT COUNT(*) as c FROM numbering_requests WHERE status = '占号'`).get() as { c: number };
  if (count.c > 0) return;

  const targets = [
    { category: '墓葬', count: 22, prefix: 'M' },
    { category: '灰坑', count: 71, prefix: 'H' },
    { category: '柱洞', count: 300, prefix: 'D' },
    { category: '灶', count: 3, prefix: 'Z' },
    { category: '烧土遗迹', count: 5, prefix: 'S' },
  ];

  const now = new Date().toISOString();
  const insert = db.prepare(
    `INSERT INTO numbering_requests (category, assigned_number, status, created_at, updated_at)
     VALUES (@category, @assigned_number, '占号', @created_at, @updated_at)`
  );

  const run = db.transaction(() => {
    for (const t of targets) {
      for (let i = 1; i <= t.count; i++) {
        insert.run({ category: t.category, assigned_number: `${t.prefix}${i}`, created_at: now, updated_at: now });
      }
    }
  });
  run();
}
