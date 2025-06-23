import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">LLM 代理服务</h1>
          <p className="text-xl text-gray-600">
            符合 OpenAI 规范的大模型代理接口，支持请求转发和日志记录
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-2xl font-semibold mb-4">🚀 主要功能</h2>
            <ul className="space-y-2 text-gray-700">
              <li>✅ 符合 OpenAI API 规范</li>
              <li>✅ 支持请求转发到任何兼容的大模型API</li>
              <li>✅ 详细的请求和响应日志记录</li>
              <li>✅ 支持多种认证方式</li>
              <li>✅ CORS 支持</li>
              <li>✅ 错误处理和重试机制</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-2xl font-semibold mb-4">🎯 使用场景</h2>
            <ul className="space-y-2 text-gray-700">
              <li>🔍 调试大模型API请求</li>
              <li>📊 监控API调用情况</li>
              <li>🔀 多模型切换和负载均衡</li>
              <li>🛡️ API密钥保护</li>
              <li>📈 请求统计和分析</li>
              <li>🌐 跨域请求代理</li>
            </ul>
          </div>
        </div>

        <div className="text-center mb-8">
          <Link
            href="/proxy-test"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            开始测试代理接口
          </Link>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">📋 API 端点</h2>
          <div className="space-y-4">
            <div className="bg-white p-4 rounded border">
              <h3 className="font-semibold text-lg mb-2">Chat Completions</h3>
              <p className="text-gray-600 mb-2">符合 OpenAI Chat Completions API 规范的代理端点</p>
              <code className="bg-gray-100 px-2 py-1 rounded">POST /api/v1/chat/completions</code>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">⚙️ 快速配置</h2>
          <div className="space-y-2 text-sm">
            <p>1. 创建 <code className="bg-white px-2 py-1 rounded">.env.local</code> 文件</p>
            <p>2. 添加配置：<code className="bg-white px-2 py-1 rounded">TARGET_API_URL=https://api.openai.com/v1/chat/completions</code></p>
            <p>3. 启动服务：<code className="bg-white px-2 py-1 rounded">npm run dev</code></p>
            <p>4. 访问测试页面进行调试</p>
          </div>
        </div>
      </main>
    </div>
  );
}
