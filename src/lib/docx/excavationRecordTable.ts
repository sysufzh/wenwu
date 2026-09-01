import { Document, TableRow } from 'docx';
import { title, infoLine, kvRow, makeTable, makeDoc, UNIT_NAME } from './common';
import { FeatureWithChildren, composeDepositText, composeArtifactText } from '@/db/excavation';

function firstLayerValue(f: FeatureWithChildren, key: 'cleaning_method' | 'deposit_nature' | 'preservation'): string {
  const layer = f.layers.find(l => (l[key] || '').trim());
  return layer ? layer[key] : '';
}

export function buildExcavationRecordTable(f: FeatureWithChildren): Document {
  const depositText = composeDepositText(f.layers);
  const artifactText = composeArtifactText(f.artifacts);

  const rows: TableRow[] = [
    kvRow('探方号', f.trench_number),
    kvRow('单位号', f.feature_number),
    kvRow('记录日期', f.record_date),
    kvRow('绘图号', f.drawing_info || '见绘图登记表'),
    kvRow('照相号', f.photo_info || '见照相登记表'),
    kvRow('记录者', f.recorder),
    kvRow('层位关系', f.stratigraphy),
    kvRow('深度', f.depth),
    kvRow('堆积描述', depositText, { valueSize: 21 }),
    kvRow('形状描述', f.shape, { valueSize: 21 }),
    kvRow('坑壁与底', f.wall_bottom_detail, { valueSize: 21 }),
    kvRow('清理方式', firstLayerValue(f, 'cleaning_method'), { valueSize: 21 }),
    kvRow('堆积性质', firstLayerValue(f, 'deposit_nature')),
    kvRow('保存状况', firstLayerValue(f, 'preservation')),
    kvRow('遗物采集', artifactText, { valueSize: 21 }),
    kvRow('测试标本采样', f.sampling, { valueSize: 21 }),
    kvRow('备注', f.remarks),
  ];

  return makeDoc([
    title(`${f.trench_number}${f.feature_number}发掘记录表`, 32),
    infoLine(`年度：${f.year}    遗址名：${f.site_name || '牛头山遗址'}    发掘单位：${UNIT_NAME}    第  号`),
    infoLine(`核对人：          资料录入□    资料员：${f.recorder}`),
    makeTable(rows, [2200, 7800]),
  ]);
}
