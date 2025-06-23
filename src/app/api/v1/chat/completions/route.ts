import { NextRequest, NextResponse } from 'next/server';

// 日志存储接口
interface LogEntry {
  id: string;
  timestamp: string;
  type: 'request' | 'response';
  method?: string;
  url?: string;
  status?: number;
  headers: any;
  body: any;
}

// 内存日志存储（最多保存100条记录）
const logs: LogEntry[] = [];
const MAX_LOGS = 100;

// 添加日志到内存存储
function addLogEntry(entry: Omit<LogEntry, 'id' | 'timestamp'>) {
  const logEntry: LogEntry = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    ...entry
  };
  
  logs.unshift(logEntry); // 新日志添加到前面
  
  // 限制日志数量
  if (logs.length > MAX_LOGS) {
    logs.splice(MAX_LOGS);
  }
}

// 获取所有日志
export function getLogs(): LogEntry[] {
  return [...logs];
}

// 清空日志
export function clearLogs(): void {
  logs.splice(0, logs.length);
}

// 日志工具函数
function logRequest(method: string, url: string, headers: any, body: any) {
  console.log('\n=== 代理请求日志 ===');
  console.log(`时间: ${new Date().toISOString()}`);
  console.log(`方法: ${method}`);
  console.log(`URL: ${url}`);
  console.log('请求头:', JSON.stringify(headers, null, 2));
  console.log('请求体:', JSON.stringify(body, null, 2));
  console.log('==================\n');

  // 添加到内存存储
  addLogEntry({
    type: 'request',
    method,
    url,
    headers,
    body
  });
}

function logResponse(status: number, headers: any, body: any) {
  console.log('\n=== 代理响应日志 ===');
  console.log(`时间: ${new Date().toISOString()}`);
  console.log(`状态码: ${status}`);
  console.log('响应头:', JSON.stringify(headers, null, 2));
  console.log('响应体:', JSON.stringify(body, null, 2));
  console.log('==================\n');

  // 添加到内存存储
  addLogEntry({
    type: 'response',
    status,
    headers,
    body
  });
}

// 处理流式响应的函数
async function handleStreamResponse(response: Response, requestBody: any) {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('无法读取响应流');
  }

  const decoder = new TextDecoder();
  let fullResponse = '';
  let chunks: string[] = [];

  // 创建一个可读流来转发数据
  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            // 记录完整的响应日志
            logResponse(response.status, Object.fromEntries(response.headers), {
              stream: true,
              fullResponse: fullResponse,
              chunks: chunks
            });
            controller.close();
            break;
          }

          const chunk = decoder.decode(value);
          fullResponse += chunk;
          chunks.push(chunk);
          
          // 转发数据块
          controller.enqueue(value);
        }
      } catch (error) {
        console.error('流式处理错误:', error);
        controller.error(error);
      }
    }
  });

  return stream;
}

export async function POST(request: NextRequest) {
  try {
    // 从环境变量或请求头获取目标API URL
    const targetUrl = process.env.TARGET_API_URL || request.headers.get('x-target-url');
    
    if (!targetUrl) {
      return NextResponse.json(
        { error: '请设置环境变量 TARGET_API_URL 或请求头 x-target-url' },
        { status: 400 }
      );
    }

    // 获取请求体
    const body = await request.json();
    
    // 构建转发请求的头部
    const forwardHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // 复制授权相关的头部
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      forwardHeaders['Authorization'] = authHeader;
    }

    const apiKeyHeader = request.headers.get('x-api-key');
    if (apiKeyHeader) {
      forwardHeaders['X-API-Key'] = apiKeyHeader;
    }

    // 记录请求日志
    logRequest('POST', targetUrl, forwardHeaders, body);

    // 转发请求到目标API
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: forwardHeaders,
      body: JSON.stringify(body),
    });

    // 检查是否是流式请求
    if (body.stream === true) {
      // 处理流式响应
      const stream = await handleStreamResponse(response, body);
      
      // 构建流式响应头
      const responseHeaders = new Headers();
      responseHeaders.set('Content-Type', 'text/plain; charset=utf-8');
      responseHeaders.set('Cache-Control', 'no-cache');
      responseHeaders.set('Connection', 'keep-alive');
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Target-URL');
      
      // 复制一些重要的响应头
      const corsHeaders = ['access-control-allow-origin', 'access-control-allow-methods', 'access-control-allow-headers'];
      corsHeaders.forEach(header => {
        const value = response.headers.get(header);
        if (value) {
          responseHeaders.set(header, value);
        }
      });

      return new NextResponse(stream, {
        status: response.status,
        headers: responseHeaders,
      });
    } else {
      // 处理非流式响应（原有逻辑）
      const responseData = await response.json();
      
      // 构建响应头
      const responseHeaders = new Headers();
      responseHeaders.set('Content-Type', 'application/json');
      
      // 复制一些重要的响应头
      const corsHeaders = ['access-control-allow-origin', 'access-control-allow-methods', 'access-control-allow-headers'];
      corsHeaders.forEach(header => {
        const value = response.headers.get(header);
        if (value) {
          responseHeaders.set(header, value);
        }
      });

      // 记录响应日志
      logResponse(response.status, Object.fromEntries(responseHeaders), responseData);

      // 返回响应
      return NextResponse.json(responseData, {
        status: response.status,
        headers: responseHeaders,
      });
    }

  } catch (error) {
    console.error('\n=== 代理错误日志 ===');
    console.error(`时间: ${new Date().toISOString()}`);
    console.error('错误:', error);
    console.error('==================\n');

    return NextResponse.json(
      { 
        error: '代理请求失败',
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Target-URL',
    },
  });
} 