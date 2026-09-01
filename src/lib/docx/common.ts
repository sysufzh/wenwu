import {
  Document, Paragraph, TextRun, TableCell, TableRow, Table, WidthType,
  BorderStyle, AlignmentType, VerticalAlign, Packer, PageOrientation,
} from 'docx';

// 中文宋体，保证中文在 Word 中正常显示
export const ZH = { ascii: '宋体', hAnsi: '宋体', eastAsia: '宋体' } as const;

const CELL_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
};

export function run(text: string, opts: { bold?: boolean; size?: number } = {}): TextRun {
  return new TextRun({ text: text ?? '', bold: opts.bold, size: opts.size ?? 21, font: ZH });
}

export function paragraph(text: string, opts: { bold?: boolean; size?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}): Paragraph {
  return new Paragraph({
    children: [run(text, { bold: opts.bold, size: opts.size })],
    alignment: opts.align,
    spacing: { before: 0, after: 0 },
  });
}

export function title(text: string, size = 32): Paragraph {
  return new Paragraph({
    children: [run(text, { bold: true, size })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 160 },
  });
}

export function infoLine(text: string): Paragraph {
  return new Paragraph({
    children: [run(text, { size: 21 })],
    spacing: { before: 0, after: 120 },
  });
}

// 单元格：文本可含换行，逐行生成段落
export function cell(text: string, opts: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; size?: number } = {}): TableCell {
  const lines = (text ?? '').length ? (text ?? '').split('\n') : [''];
  return new TableCell({
    children: lines.map(l => paragraph(l, { bold: opts.bold, align: opts.align, size: opts.size })),
    borders: CELL_BORDERS,
    verticalAlign: VerticalAlign.CENTER,
  });
}

export function labelCell(text: string): TableCell {
  return cell(text, { bold: true });
}

export function headerCell(text: string): TableCell {
  return new TableCell({
    children: [paragraph(text, { bold: true, align: AlignmentType.CENTER })],
    borders: CELL_BORDERS,
    verticalAlign: VerticalAlign.CENTER,
    shading: { fill: 'F2F2F2' },
  });
}

// 标签+内容 两列表的一行
export function kvRow(label: string, value: string, opts: { valueSize?: number } = {}): TableRow {
  return new TableRow({
    children: [labelCell(label), cell(value, { size: opts.valueSize })],
  });
}

export function makeTable(rows: TableRow[], columnWidths: number[]): Table {
  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths,
  });
}

export function makeDoc(children: (Paragraph | Table)[]): Document {
  return new Document({
    sections: [{
      properties: {
        page: {
          size: { orientation: PageOrientation.PORTRAIT },
          margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 },
        },
      },
      children,
    }],
  });
}

export async function toBuffer(doc: Document): Promise<Buffer> {
  return Packer.toBuffer(doc);
}

export const UNIT_NAME = '中国社会科学院考古研究所东南工作队';
