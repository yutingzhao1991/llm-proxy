import { NextRequest, NextResponse } from 'next/server';
import { logRequest, logResponse } from '@/lib/logger';

// 定义消息数据类型
interface MessageData {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string | null;
  }>;
}

// 解析流式响应数据，提取完整的聊天内容
function parseStreamResponse(fullResponse: string) {
  try {
    const lines = fullResponse.split('\n').filter(line => line.trim());
    let completeMessage = '';
    let messageData: MessageData = {};
    
    for (const line of lines) {
      if (line.startsWith('data: ') && !line.includes('[DONE]')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.choices && data.choices[0] && data.choices[0].delta) {
            // 收集基本信息（使用第一个有效数据）
            if (!messageData.id && data.id) {
              messageData = {
                id: data.id,
                object: data.object,
                created: data.created,
                model: data.model,
                choices: [{
                  index: 0,
                  message: {
                    role: 'assistant',
                    content: ''
                  },
                  finish_reason: null
                }]
              };
            }
            
            // 收集内容
            if (data.choices[0].delta.content) {
              completeMessage += data.choices[0].delta.content;
            }
            
            // 记录结束原因
            if (data.choices[0].finish_reason && messageData.choices && messageData.choices[0]) {
              messageData.choices[0].finish_reason = data.choices[0].finish_reason;
            }
          }
        } catch {
          // 忽略解析错误，继续处理下一行
        }
      }
    }
    
    // 设置完整的消息内容
    if (messageData.choices && messageData.choices[0]) {
      messageData.choices[0].message.content = completeMessage;
    }
    
    return messageData.id ? messageData : { 
      content: completeMessage,
      rawStream: fullResponse 
    };
  } catch {
    // 如果解析失败，返回原始数据
    return {
      error: '流式数据解析失败',
      rawStream: fullResponse
    };
  }
}

// 处理流式响应的函数
async function handleStreamResponse(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('无法读取响应流');
  }

  const decoder = new TextDecoder();
  let fullResponse = '';

  // 创建一个可读流来转发数据
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let controllerClosed = false;
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            // 解析完整的流式响应数据
            const parsedResponse = parseStreamResponse(fullResponse);
            
            // 记录整合后的完整响应日志
            logResponse(response.status, Object.fromEntries(response.headers), parsedResponse);
            
            if (!controllerClosed) {
              controller.close();
              controllerClosed = true;
            }
            break;
          }

          const chunk = decoder.decode(value);
          fullResponse += chunk;
          
          // 转发数据块，确保controller未关闭
          if (!controllerClosed) {
            try {
              controller.enqueue(value);
            } catch (enqueueError: unknown) {
              if (enqueueError instanceof Error && enqueueError.message.includes('ERR_INVALID_STATE')) {
                controllerClosed = true;
                console.log('Controller已关闭，但继续收集完整响应');
              } else {
                throw enqueueError;
              }
            }
          }
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
    // 优先使用请求头 x-target-url，其次用环境变量
    const xTargetUrl = request.headers.get('x-target-url');
    const targetUrl = xTargetUrl || process.env.TARGET_API_URL;
    
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
      const stream = await handleStreamResponse(response);
      
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
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Target-URL',
    },
  });
} 