'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Message {
  role?: string;
  content: string;
  name?: string;
  function_call?: any;
}

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

export default function LogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [log, setLog] = useState<LogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const fetchLogDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/v1/logs/${params.id}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const result = await response.json();
        if (result.success) {
          setLog(result.data);
          
          // 解析 messages
          const extractedMessages: Message[] = [];
          
          // 处理请求或响应中的 messages
          if (result.data.body) {
            // 请求中的 messages
            if (result.data.type === 'request' && result.data.body.messages) {
              extractedMessages.push(...result.data.body.messages);
            }
            
            // 响应中的 messages
            if (result.data.type === 'response' && result.data.body.choices) {
              result.data.body.choices.forEach((choice: any) => {
                if (choice.message) {
                  extractedMessages.push(choice.message);
                }
              });
            }
          }
          
          setMessages(extractedMessages);
        } else {
          setError(result.error || '获取日志详情失败');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取日志详情失败');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchLogDetail();
    }
  }, [params.id]);

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

  // 渲染消息内容，处理 markdown 或纯文本
  const renderMessageContent = (content: string) => {
    // 简单处理，实际项目中可以使用 markdown 解析库
    return (
      <div className="whitespace-pre-wrap">{content}</div>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">加载中...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <strong>错误:</strong> {error}
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          返回
        </button>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4">
          未找到日志记录
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <Link href="/" className="text-blue-600 hover:underline">
          返回日志列表
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-4">日志详情</h1>

      <div className={`border rounded-lg p-4 mb-6 ${getStatusColor(log.type, log.status)}`}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-semibold">类型:</p>
            <p>{log.type === 'request' ? '📤 请求' : '📥 响应'}</p>
          </div>
          <div>
            <p className="font-semibold">时间:</p>
            <p>{formatTime(log.timestamp)}</p>
          </div>
          {log.method && (
            <div>
              <p className="font-semibold">方法:</p>
              <p>{log.method}</p>
            </div>
          )}
          {log.status && (
            <div>
              <p className="font-semibold">状态码:</p>
              <p>{log.status}</p>
            </div>
          )}
          {log.url && (
            <div className="col-span-2">
              <p className="font-semibold">URL:</p>
              <p className="break-all">{log.url}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">请求头</h2>
        <pre className="bg-gray-50 p-4 rounded overflow-x-auto">
          {JSON.stringify(log.headers, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">原始内容</h2>
        <pre className="bg-gray-50 p-4 rounded overflow-x-auto">
          {JSON.stringify(log.body, null, 2)}
        </pre>
      </div>

      {messages.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">消息解析</h2>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  {message.role && (
                    <span className={`px-2 py-1 rounded text-xs ${
                      message.role === 'user' ? 'bg-blue-100 text-blue-800' : 
                      message.role === 'assistant' ? 'bg-green-100 text-green-800' : 
                      message.role === 'system' ? 'bg-purple-100 text-purple-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {message.role}
                    </span>
                  )}
                  {message.name && (
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                      {message.name}
                    </span>
                  )}
                </div>
                
                {message.content && (
                  <div className="bg-white p-3 rounded">
                    {renderMessageContent(message.content)}
                  </div>
                )}
                
                {message.function_call && (
                  <div className="mt-2">
                    <p className="font-semibold text-sm">函数调用:</p>
                    <pre className="bg-gray-50 p-2 rounded text-sm overflow-x-auto">
                      {JSON.stringify(message.function_call, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 