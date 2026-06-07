import { NextRequest, NextResponse } from 'next/server';
import { getTransactions, createTransaction, TransactionListParams } from '@/db/transactions';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const typeParam = searchParams.get('type') || '';
    const params: TransactionListParams = {
      search: searchParams.get('search') || '',
      type: (typeParam === '收入' || typeParam === '支出') ? typeParam : '',
      category: searchParams.get('category') || '',
      dateFrom: searchParams.get('dateFrom') || '',
      dateTo: searchParams.get('dateTo') || '',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };
    const result = getTransactions(params);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: '获取交易列表失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.transaction_date) {
      return NextResponse.json({ error: '日期不能为空' }, { status: 400 });
    }
    if (!body.type) {
      return NextResponse.json({ error: '类型不能为空' }, { status: 400 });
    }
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json({ error: '金额必须大于0' }, { status: 400 });
    }
    const transaction = createTransaction(body);
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '创建交易失败' }, { status: 500 });
  }
}
