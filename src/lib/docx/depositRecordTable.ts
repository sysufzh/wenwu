import { Document, Paragraph, TableRow } from 'docx';
import { title, infoLine, kvRow, makeTable, makeDoc, UNIT_NAME, run } from './common';
import { FeatureWithChildren, FeatureLayer, layerInclusionsText, composeSpecimensText } from '@/db/excavation';

function layerRows(l: FeatureLayer): TableRow[] {
  return [
    kvRow('层号', l.layer_number),
    kvRow('土色', l.soil_color),
    kvRow('土质', l.soil_texture),
    kvRow('致密度', l.density),
    kvRow('厚度', l.thickness),
    kvRow('堆积形状', l.deposit_shape),
    kvRow('包含物', layerInclusionsText(l), { valueSize: 21 }),
    kvRow('标本', composeSpecimensText(l.specimens_json), { valueSize: 21 }),
    kvRow('土样', l.soil_sample),
    kvRow('上界面', l.upper_interface),
    kvRow('下界面', l.lower_interface),
    kvRow('观察', l.observation, { valueSize: 21 }),
    kvRow('保存状况', l.preservation),
    kvRow('清理方式', l.cleaning_method, { valueSize: 21 }),
    kvRow('堆积性质', l.deposit_nature),
    kvRow('深度', l.depth_text),
    kvRow('备注', l.remarks),
  ];
}

export function buildDepositRecordTable(f: FeatureWithChildren): Document {
  const children: (Paragraph | ReturnType<typeof makeTable>)[] = [];

  children.push(title(`${f.trench_number}${f.feature_number}堆积记录表`, 32));
  children.push(infoLine(`年度：${f.year}    遗址名：${f.site_name || '牛头山遗址'}    发掘单位：${UNIT_NAME}    第  号`));

  f.layers.forEach((l, idx) => {
    children.push(new Paragraph({
      children: [run(`堆积层 ${l.layer_number || String(idx + 1)}`, { bold: true, size: 24 })],
      spacing: { before: 160, after: 60 },
    }));
    children.push(makeTable(layerRows(l), [2200, 7800]));
  });

  if (f.layers.length === 0) {
    children.push(new Paragraph({ children: [run('（无堆积层记录）', { size: 21 })] }));
  }

  return makeDoc(children);
}
