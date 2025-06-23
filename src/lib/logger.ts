// 日志存储接口
export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'request' | 'response';
  method?: string;
  url?: string;
  status?: number;
  headers: Record<string, unknown>;
  body: unknown;
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

// 根据ID获取日志
export function getLogById(id: string): LogEntry | null {
  const allLogs = getLogs();
  return allLogs.find(log => log.id === id) || null;
}

// 清空日志
export function clearLogs(): void {
  logs.splice(0, logs.length);
}

// 日志工具函数
export function logRequest(method: string, url: string, headers: Record<string, unknown>, body: unknown) {
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

export function logResponse(status: number, headers: Record<string, unknown>, body: unknown) {
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