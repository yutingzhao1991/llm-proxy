import { NextRequest, NextResponse } from 'next/server';
import { getLogs, clearLogs } from '../chat/completions/route';

// 根据ID获取日志
export function getLogById(id: string) {
  const logs = getLogs();
  return logs.find(log => log.id === id) || null;
}

// 获取日志
export async function GET(request: NextRequest) {
  try {
    const logs = getLogs();
    return NextResponse.json({
      success: true,
      data: logs,
      total: logs.length
    });
  } catch (error) {
    console.error('获取日志失败:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '获取日志失败',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// 清空日志
export async function DELETE(request: NextRequest) {
  try {
    clearLogs();
    return NextResponse.json({
      success: true,
      message: '日志已清空'
    });
  } catch (error) {
    console.error('清空日志失败:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '清空日志失败',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// 支持OPTIONS请求（CORS预检）
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 