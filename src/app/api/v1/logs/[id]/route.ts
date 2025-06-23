import { NextRequest, NextResponse } from 'next/server';
import { getLogById } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const log = getLogById(id);
    
    if (!log) {
      return NextResponse.json({ 
        success: false, 
        error: '未找到日志记录' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: log 
    });
  } catch (error) {
    console.error('Error fetching log:', error);
    return NextResponse.json({ 
      success: false, 
      error: '获取日志失败' 
    }, { status: 500 });
  }
} 