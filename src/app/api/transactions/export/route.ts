import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getTransactionsForExport, TransactionListParams } from '@/db/transactions';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const sp = request.nextUrl.searchParams;
    const typeParam = sp.get('type') || '';
    const ledgerParam = sp.get('ledgerType') || '';
    const ledgerType = (ledgerParam === '生活' || ledgerParam === '工作') ? ledgerParam : '';
    const ledgerLabel = ledgerType || '全部';

    const params: TransactionListParams = {
      search: sp.get('search') || '',
      type: (typeParam === '收入' || typeParam === '支出') ? typeParam : '',
      category: sp.get('category') || '',
      fundingSource: sp.get('fundingSource') || '',
      ledgerType,
      dateFrom: sp.get('dateFrom') || '',
      dateTo: sp.get('dateTo') || '',
    };

    const rows = getTransactionsForExport(params);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`${ledgerLabel}账本`);

    sheet.columns = [
      { header: '日期', key: 'transaction_date', width: 12 },
      { header: '类型', key: 'type', width: 8 },
      { header: '类别', key: 'category', width: 14 },
      { header: '金额', key: 'amount', width: 12, style: { numFmt: '#,##0.00' } },
      { header: '摘要', key: 'description', width: 28 },
      { header: '经费来源', key: 'funding_source', width: 16 },
      { header: '报销状态', key: 'reimbursement_status', width: 10 },
      { header: '经办人', key: 'handler', width: 12 },
      { header: '备注', key: 'remarks', width: 20 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
    headerRow.eachCell(cell => {
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' },
      };
    });

    for (const r of rows) {
      sheet.addRow({
        transaction_date: r.transaction_date,
        type: r.type,
        category: r.category,
        amount: r.amount,
        description: r.description,
        funding_source: r.funding_source,
        reimbursement_status: r.reimbursement_status,
        handler: r.handler,
        remarks: r.remarks,
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const data = Buffer.from(buffer);

    const filename = `${ledgerLabel}账本.xlsx`;
    return new NextResponse(data, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="export.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch {
    return NextResponse.json({ error: '导出失败' }, { status: 500 });
  }
}
