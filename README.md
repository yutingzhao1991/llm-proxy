This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# LLM 代理服务

一个符合 OpenAI 规范的大模型代理接口，支持请求转发和详细日志记录，用于调试和监控大模型API调用。

## 🚀 主要功能

- ✅ **标准兼容**: 完全符合 OpenAI Chat Completions API 规范
- ✅ **请求转发**: 支持转发到任何兼容的大模型API（OpenAI、Claude、本地模型等）
- ✅ **详细日志**: 记录完整的请求和响应内容，便于调试
- ✅ **多种认证**: 支持 Bearer Token 和 API Key 认证
- ✅ **CORS 支持**: 支持跨域请求
- ✅ **错误处理**: 完善的错误处理和状态码传递

## 🎯 使用场景

- 🔍 **调试大模型请求**: 查看完整的请求和响应数据
- 📊 **API 监控**: 监控大模型API的调用情况
- 🔀 **多模型切换**: 通过配置轻松切换不同的模型提供商
- 🛡️ **密钥保护**: 在客户端隐藏真实的API密钥
- 📈 **请求分析**: 分析API使用模式和性能
- 🌐 **跨域代理**: 解决浏览器跨域限制

## 🛠️ 安装和配置

### 1. 克隆项目

```bash
git clone <repository-url>
cd llm-proxy
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

创建 `.env.local` 文件：

```env
# 目标API URL（必需）
TARGET_API_URL=https://api.openai.com/v1/chat/completions

# 默认API密钥（可选）
DEFAULT_API_KEY=your_api_key_here
```

### 4. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

服务将在 `http://localhost:3000` 启动。

## 📋 API 使用

### 端点

```
POST /api/v1/chat/completions
```

### 请求头

```http
Content-Type: application/json
Authorization: Bearer your_api_key          # 可选
x-target-url: https://api.target.com/v1/chat/completions  # 可选，覆盖环境变量
```

### 请求体

符合 OpenAI Chat Completions API 规范：

```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1000
}
```

### 响应

返回目标API的原始响应，格式与 OpenAI API 一致。

## 🔧 配置选项

### 环境变量

| 变量名 | 描述 | 必需 | 示例 |
|--------|------|------|------|
| `TARGET_API_URL` | 目标API的完整URL | 是* | `https://api.openai.com/v1/chat/completions` |
| `DEFAULT_API_KEY` | 默认的API密钥 | 否 | `sk-...` |

*注：如果未设置环境变量，可以通过请求头 `x-target-url` 指定

### 支持的目标API

- **OpenAI**: `https://api.openai.com/v1/chat/completions`
- **Azure OpenAI**: `https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2023-05-15`
- **Anthropic Claude**: `https://api.anthropic.com/v1/messages`
- **本地部署**: `http://localhost:8080/v1/chat/completions`
- 其他兼容 OpenAI 格式的API

## 🧪 测试界面

访问 `http://localhost:3000/proxy-test` 使用内置的测试界面：

- 🎯 可视化配置目标API
- 📝 输入测试消息
- 👀 查看实时响应
- 📊 复制请求/响应数据

## 📝 日志格式

代理会在控制台输出详细的日志：

```
=== 代理请求日志 ===
时间: 2024-01-01T12:00:00.000Z
方法: POST
URL: https://api.openai.com/v1/chat/completions
请求头: {
  "Content-Type": "application/json",
  "Authorization": "Bearer sk-..."
}
请求体: {
  "model": "gpt-3.5-turbo",
  "messages": [...]
}
==================

=== 代理响应日志 ===
时间: 2024-01-01T12:00:01.000Z
状态码: 200
响应头: {...}
响应体: {
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "choices": [...]
}
==================
```

## 🚀 部署

### Vercel 部署

```bash
npm i -g vercel
vercel
```

### Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### 环境变量配置

部署时记得设置环境变量：
- `TARGET_API_URL`
- `DEFAULT_API_KEY`（如需要）

## 🔒 安全考虑

- 🔐 不要在客户端暴露真实的API密钥
- 🛡️ 在生产环境中限制CORS来源
- 📊 监控API使用量，防止滥用
- 🔍 定期审查日志，确保无敏感信息泄露

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## �� 许可证

MIT License
