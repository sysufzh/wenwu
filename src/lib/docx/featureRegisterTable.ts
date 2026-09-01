import { Document, TableRow } from 'docx';
import { title, infoLine, headerCell, cell, makeTable, makeDoc, UNIT_NAME } from './common';
import { FeatureWithChildren, composeDepositText, composeArtifactText } from '@/db/excavation';

export function buildFeatureRegisterTable(f: FeatureWithChildren): Document {
  const depositText = composeDepositText(f.layers).replace(/\n/g, ' ');
  const artifactText = composeArtifactText(f.artifacts).replace(/\n/g, ' ');

  const header = new TableRow({
    children: [
      headerCell('遗迹号'), headerCell('探方位置'), headerCell('开口形状'), headerCell('尺寸'),
      headerCell('开口层位及关系'), headerCell('土质土色包含物及堆积厚度'), headerCell('出土文物'), headerCell('日期'),
    ],
  });

  const data = new TableRow({
    children: [
      cell(f.feature_number),
      cell(`${f.trench_number}${f.position ? ' ' + f.position : ''}`),
      cell(f.shape),
      cell(f.opening_size),
      cell(f.stratigraphy),
      cell(depositText),
      cell(artifactText),
      cell(f.record_date),
    ],
  });

  return makeDoc([
    title('遗 迹 登 记 表', 32),
    infoLine(`年度：${f.year}    遗址名：${f.site_name || '牛头山遗址'}    区位：${f.district}    记录者：${f.recorder}`),
    makeTable([header, data], [700, 1400, 1100, 1300, 1600, 2200, 1500, 800]),
    infoLine(`${UNIT_NAME}制表`),
  ]);
}
