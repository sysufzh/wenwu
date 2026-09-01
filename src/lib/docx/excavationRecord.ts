import { Document, Paragraph, TableRow, AlignmentType } from 'docx';
import { title, infoLine, kvRow, makeTable, makeDoc, UNIT_NAME, run } from './common';
import { FeatureWithChildren, composeDepositText, composeArtifactText } from '@/db/excavation';

export function buildExcavationRecord(f: FeatureWithChildren): Document {
  const depositText = composeDepositText(f.layers);
  const artifactText = composeArtifactText(f.artifacts);

  const rows: TableRow[] = [
    kvRow('坑号', f.feature_number),
    kvRow('位置', f.position),
    kvRow('形状', f.shape),
    kvRow('口部尺寸', f.opening_size),
    kvRow('深度', f.depth),
    kvRow('底部尺寸', f.bottom_size),
    kvRow('绘图号与图名', f.drawing_info),
    kvRow('摄影', f.photo_info),
    kvRow('发掘经过', f.excavation_process, { valueSize: 21 }),
    kvRow('堆积层与包含物', depositText, { valueSize: 21 }),
    kvRow('遗物', artifactText, { valueSize: 21 }),
    kvRow('采样', f.sampling, { valueSize: 21 }),
    kvRow('坑壁与底的细节', f.wall_bottom_detail, { valueSize: 21 }),
    kvRow('层位关系', f.stratigraphy),
    kvRow('年代推断', f.dating),
    kvRow('性质功能', f.function_nature),
    kvRow('备注', f.remarks),
    kvRow('记录者', `${f.recorder}    记录日期：${f.record_date}`),
  ];

  const table = makeTable(rows, [2200, 7800]);

  return makeDoc([
    title('发掘记录', 36),
    infoLine(`${f.trench_number}${f.feature_number}    遗址名：${f.site_name || '牛头山遗址'}    发掘单位：${UNIT_NAME}`),
    table,
    new Paragraph({
      children: [run(`${UNIT_NAME}制表`, { size: 18 })],
      alignment: AlignmentType.RIGHT,
      spacing: { before: 200, after: 0 },
    }),
  ]);
}
