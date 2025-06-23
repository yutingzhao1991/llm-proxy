import { useState, useEffect } from 'react';

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

interface LogViewerProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function LogViewer({ autoRefresh = true, refreshInterval = 2000 }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string>('');
  const [isAutoRefresh, setIsAutoRefresh] = useState(autoRefresh);

  // 获取日志
  const fetchLogs = async () => {
    try {
      setError('');
      const response = await fetch('/api/v1/logs');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      if (result.success) {
        setLogs(result.data || []);
      } else {
        setError(result.error || '获取日志失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取日志失败');
    }
  };

  // 清空日志
  const clearLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/logs', { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      if (result.success) {
        setLogs([]);
        setError('');
      } else {
        setError(result.error || '清空日志失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '清空日志失败');
    } finally {
      setLoading(false);
    }
  };

  // 自动刷新效果
  useEffect(() => {
    if (isAutoRefresh) {
      const interval = setInterval(fetchLogs, refreshInterval);
      fetchLogs(); // 立即执行一次
      return () => clearInterval(interval);
    } else {
      fetchLogs(); // 只执行一次
    }
  }, [isAutoRefresh, refreshInterval]);

  // 格式化时间
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  // 获取状态颜色
  const getStatusColor = (type: string, status?: number) => {
    if (type === 'request') {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (status && status >= 200 && status < 300) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (status && status >= 400) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // 切换日志展开状态
  const toggleExpanded = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? '' : logId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">代理日志监控</h2>
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isAutoRefresh}
              onChange={(e) => setIsAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">自动刷新</span>
          </label>
          <button
            onClick={fetchLogs}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            手动刷新
          </button>
          <button
            onClick={clearLogs}
            disabled={loading}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? '清空中...' : '清空日志'}
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        共 {logs.length} 条日志记录 {isAutoRefresh && `(每${refreshInterval/1000}秒自动刷新)`}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <strong>错误:</strong> {error}
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            暂无日志记录
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`border rounded-lg p-3 ${getStatusColor(log.type, log.status)}`}
            >
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleExpanded(log.id)}
              >
                <div className="flex items-center space-x-3">
                  <span className="font-medium">
                    {log.type === 'request' ? '📤 请求' : '📥 响应'}
                  </span>
                  {log.method && (
                    <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                      {log.method}
                    </span>
                  )}
                  {log.status && (
                    <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                      {log.status}
                    </span>
                  )}
                  <span className="text-xs text-gray-600">
                    {formatTime(log.timestamp)}
                  </span>
                </div>
                <span className="text-sm">
                  {expandedLogId === log.id ? '🔽' : '▶️'}
                </span>
              </div>

              {log.url && (
                <div className="mt-1 text-xs text-gray-700 truncate">
                  {log.url}
                </div>
              )}

              {expandedLogId === log.id && (
                <div className="mt-3 space-y-2 text-xs">
                  <div>
                    <strong>请求头:</strong>
                    <pre className="mt-1 bg-white bg-opacity-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.headers, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <strong>内容:</strong>
                    <pre className="mt-1 bg-white bg-opacity-50 p-2 rounded overflow-x-auto max-h-40 overflow-y-auto">
                      {JSON.stringify(log.body, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 