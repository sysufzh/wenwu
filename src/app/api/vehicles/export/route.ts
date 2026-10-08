import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getVehicleUsagesByYear } from '@/db/vehicle';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const year = request.nextUrl.searchParams.get('year') || '';
    if (!year) return NextResponse.json({ error: '缺少年份参数' }, { status: 400 });

    const rows = getVehicleUsagesByYear(year);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`${year}年用车记录`);

    sheet.columns = [
      { header: '日期', key: 'usage_date', width: 14 },
      { header: '开始时间', key: 'usage_time_start', width: 12 },
      { header: '结束时间', key: 'usage_time_end', width: 12 },
      { header: '车牌号', key: 'license_plate', width: 14 },
      { header: '使用人', key: 'user_name', width: 12 },
      { header: '使用事项', key: 'purpose', width: 24 },
      { header: '备注', key: 'remarks', width: 24 },
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
        usage_date: r.usage_date,
        usage_time_start: r.usage_time_start,
        usage_time_end: r.usage_time_end,
        license_plate: r.license_plate,
        user_name: r.user_name,
        purpose: r.purpose,
        remarks: r.remarks,
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const data = Buffer.from(buffer);

    const filename = `${year}年用车记录.xlsx`;
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
