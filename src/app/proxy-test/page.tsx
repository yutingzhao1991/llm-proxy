'use client';

import { useState, useRef } from 'react';
import LogViewer from '../components/LogViewer';

export default function ProxyTestPage() {
  const [targetUrl, setTargetUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('Hello, how are you?');
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 流式响应处理
  const testStreamingProxy = async () => {
    if (!targetUrl) {
      alert('请输入目标API URL');
      return;
    }

    setLoading(true);
    setResponse('');
    
    // 创建新的AbortController用于取消请求
    abortControllerRef.current = new AbortController();

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'x-target-url': targetUrl,
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const requestBody = {
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        stream: true
      };

      const res = await fetch('/api/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errorData = await res.json();
        setResponse(`错误 ${res.status}: ${JSON.stringify(errorData, null, 2)}`);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setResponse('错误: 无法读取响应流');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';
      let assistantMessage = '';
      let rawData = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        rawData += chunk;
        
        // 处理缓冲区中的完整行
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留不完整的行
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          if (trimmedLine === '') continue;
          if (trimmedLine === 'data: [DONE]') continue;
          if (!trimmedLine.startsWith('data: ')) continue;
          
          try {
            const jsonStr = trimmedLine.slice(6); // 移除 'data: ' 前缀
            const data = JSON.parse(jsonStr);
            
            // 提取消息内容
            if (data.choices && data.choices[0] && data.choices[0].delta) {
              const delta = data.choices[0].delta;
              if (delta.content) {
                assistantMessage += delta.content;
              }
            }
          } catch (e) {
            console.warn('解析SSE数据失败:', trimmedLine, e);
          }
        }
        
        // 根据显示模式更新内容
        if (showRawData) {
          fullResponse = `=== 原始流式数据 ===\n${rawData}\n\n=== 提取的消息内容 ===\n${assistantMessage}`;
        } else {
          fullResponse = assistantMessage || '等待响应...';
        }
        setResponse(fullResponse);
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        setResponse(prev => prev + '\n\n[请求已取消]');
      } else {
        setResponse(`错误: ${error.message || error}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 非流式响应处理
  const testProxy = async () => {
    if (!targetUrl) {
      alert('请输入目标API URL');
      return;
    }

    setLoading(true);
    setResponse('');

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'x-target-url': targetUrl,
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const requestBody = {
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        stream: false
      };

      const res = await fetch('/api/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponse(`错误: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 取消请求
  const cancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* 页面标题 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">LLM 代理接口测试</h1>
      </div>

      {/* 主要内容区域 - 左右布局 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧 - 测试功能区域 */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* 使用说明 */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">使用说明</h2>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>本代理接口符合 OpenAI API 规范</li>
                <li>支持转发请求到任何兼容的大模型API</li>
                <li>支持流式和非流式两种响应模式</li>
                <li>会在控制台日志中记录请求和响应内容</li>
                <li>支持通过环境变量 TARGET_API_URL 或请求头 x-target-url 设置目标地址</li>
              </ul>
            </div>

            {/* 表单和响应区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 左侧表单 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    目标API URL *
                  </label>
                  <input
                    type="text"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://api.openai.com/v1/chat/completions"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    API Key (可选)
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="your_api_key_here"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    模型名称
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    测试消息
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="streaming"
                    checked={isStreaming}
                    onChange={(e) => setIsStreaming(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="streaming" className="text-sm font-medium">
                    启用流式响应
                  </label>
                </div>

                {isStreaming && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="showRawData"
                      checked={showRawData}
                      onChange={(e) => setShowRawData(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="showRawData" className="text-sm font-medium">
                      显示原始数据
                    </label>
                  </div>
                )}

                <div className="space-y-2">
                  <button
                    onClick={isStreaming ? testStreamingProxy : testProxy}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? (isStreaming ? '流式测试中...' : '测试中...') : (isStreaming ? '开始流式测试' : '测试代理接口')}
                  </button>
                  
                  {loading && isStreaming && (
                    <button
                      onClick={cancelRequest}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
                    >
                      取消请求
                    </button>
                  )}
                </div>
              </div>

              {/* 右侧响应区域 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    响应结果 {isStreaming ? (showRawData ? '(实时流式显示 - 包含原始数据)' : '(实时流式显示 - 仅消息内容)') : ''}
                  </label>
                  <textarea
                    value={response}
                    readOnly
                    rows={16}
                    className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
                    placeholder="响应内容将显示在这里..."
                  />
                </div>
                
                <button
                  onClick={() => setResponse('')}
                  className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                >
                  清空响应
                </button>
              </div>
            </div>

            {/* API信息和环境配置 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">API 端点信息</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>代理端点:</strong> <code>POST /api/v1/chat/completions</code></p>
                  <p><strong>请求头:</strong></p>
                  <ul className="list-disc list-inside ml-4">
                    <li><code>Content-Type: application/json</code></li>
                    <li><code>Authorization: Bearer your_api_key</code> (可选)</li>
                    <li><code>x-target-url: target_api_url</code> (如未设置环境变量)</li>
                  </ul>
                  <p><strong>请求体:</strong> 符合 OpenAI Chat Completions API 规范</p>
                  <p><strong>流式支持:</strong> 设置 <code>stream: true</code> 启用流式响应</p>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">环境变量配置</h3>
                <p className="text-sm mb-2">创建 <code>.env.local</code> 文件并添加以下配置：</p>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
{`# 目标API URL
TARGET_API_URL=https://api.openai.com/v1/chat/completions

# 默认API密钥 (可选)
DEFAULT_API_KEY=your_api_key_here`}
                </pre>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">🆕 流式功能特性</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>✅ 支持实时流式响应显示</li>
                <li>✅ 保持完整的日志记录（在服务端控制台查看）</li>
                <li>✅ 支持取消流式请求</li>
                <li>✅ 兼容 OpenAI 流式 API 格式</li>
                <li>✅ 自动检测流式/非流式模式</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 右侧 - 日志监控区域 */}
        <div className="w-1/3 min-w-[400px] border-l border-gray-200 bg-gray-50">
          <div className="h-full flex flex-col">
            <div className="bg-white border-b border-gray-200 px-4 py-3">
              <h2 className="text-lg font-semibold text-gray-900">实时日志监控</h2>
            </div>
            <div className="flex-1 p-4 overflow-hidden">
              <LogViewer autoRefresh={true} refreshInterval={3000} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 