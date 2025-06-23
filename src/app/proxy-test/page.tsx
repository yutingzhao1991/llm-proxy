'use client';

import { useState } from 'react';

export default function ProxyTestPage() {
  const [targetUrl, setTargetUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('Hello, how are you?');
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

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
        temperature: 0.7
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">LLM 代理接口测试</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">使用说明</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>本代理接口符合 OpenAI API 规范</li>
          <li>支持转发请求到任何兼容的大模型API</li>
          <li>会在控制台日志中记录请求和响应内容</li>
          <li>支持通过环境变量 TARGET_API_URL 或请求头 x-target-url 设置目标地址</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <button
            onClick={testProxy}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '测试中...' : '测试代理接口'}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              响应结果
            </label>
            <textarea
              value={response}
              readOnly
              rows={20}
              className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
              placeholder="响应内容将显示在这里..."
            />
          </div>
        </div>
      </div>

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
  );
} 