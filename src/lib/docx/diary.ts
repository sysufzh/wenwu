import { Document, Paragraph, TableRow } from 'docx';
import { title, infoLine, kvRow, makeTable, makeDoc, UNIT_NAME, paragraph } from './common';
import { ExcavationDiary } from '@/db/diaries';

export function buildDiaryDoc(d: ExcavationDiary): Document {
  const rows: TableRow[] = [
    kvRow('日期', d.diary_date),
    kvRow('天气', d.weather),
    kvRow('风向', d.wind_direction),
    kvRow('湿度', d.humidity),
    kvRow('探方号', d.trench_number),
    kvRow('记录人', d.recorder),
  ];

  const contentParagraphs: Paragraph[] = (d.content || '')
    .split('\n')
    .map(line => paragraph(line, { size: 21 }));

  return makeDoc([
    title('考古日记', 36),
    infoLine(`发掘单位：${UNIT_NAME}`),
    makeTable(rows, [2200, 7800]),
    ...contentParagraphs,
  ]);
}
