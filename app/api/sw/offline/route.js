import { NextResponse } from 'next/server'

export async function GET() {
  const offlineHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Сайт недоступен - ModrinthProxy</title>
    <meta name="description" content="Сайт временно недоступен. Инструкции по решению проблемы.">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1f2937 0%, #111827 50%, #1f2937 100%);
            color: #f3f4f6;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }
        
        .container {
            max-width: 32rem;
            width: 100%;
            background: rgba(31, 41, 55, 0.5);
            backdrop-filter: blur(10px);
            border-radius: 1rem;
            border: 1px solid #374151;
            padding: 2rem;
            text-align: center;
        }
        
        .icon {
            width: 6rem;
            height: 6rem;
            margin: 0 auto 2rem;
            background: rgba(239, 68, 68, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .icon svg {
            width: 3rem;
            height: 3rem;
            color: #f87171;
        }
        
        h1 {
            font-size: 1.875rem;
            font-weight: bold;
            margin-bottom: 1rem;
        }
        
        .description {
            color: #d1d5db;
            font-size: 1.125rem;
            margin-bottom: 2rem;
        }
        
        .reasons {
            text-align: left;
            background: rgba(17, 24, 39, 0.5);
            border-radius: 0.75rem;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .reasons ul {
            list-style: none;
        }
        
        .reasons li {
            display: flex;
            align-items: flex-start;
            margin-bottom: 0.75rem;
            color: #d1d5db;
        }
        
        .reasons li:last-child {
            margin-bottom: 0;
        }
        
        .bullet {
            color: #f87171;
            margin-right: 0.75rem;
            margin-top: 0.25rem;
        }
        
        .solutions {
            text-align: left;
            background: rgba(5, 46, 22, 0.2);
            border: 1px solid rgba(34, 197, 94, 0.5);
            border-radius: 0.75rem;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .solutions h2 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #4ade80;
            margin-bottom: 1rem;
        }
        
        .solutions ol {
            list-style: none;
        }
        
        .solutions li {
            display: flex;
            align-items: flex-start;
            margin-bottom: 0.75rem;
            color: #d1d5db;
        }
        
        .solutions li:last-child {
            margin-bottom: 0;
        }
        
        .number {
            color: #4ade80;
            font-weight: bold;
            margin-right: 0.75rem;
            margin-top: 0.25rem;
        }
        
        .local-setup {
            text-align: left;
            background: rgba(30, 58, 138, 0.2);
            border: 1px solid rgba(59, 130, 246, 0.5);
            border-radius: 0.75rem;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .local-setup h2 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #60a5fa;
            margin-bottom: 1rem;
        }
        
        .code-block {
            background: rgba(17, 24, 39, 0.5);
            border-radius: 0.5rem;
            padding: 1rem;
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
            margin: 0.75rem 0;
        }
        
        .comment {
            color: #9ca3af;
            margin-bottom: 0.5rem;
        }
        
        .command {
            color: #4ade80;
        }
        
        .buttons {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        @media (min-width: 640px) {
            .buttons {
                flex-direction: row;
                justify-content: center;
            }
        }
        
        .btn {
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 600;
            text-decoration: none;
            display: inline-block;
            text-align: center;
            transition: background-color 0.2s;
            border: none;
            cursor: pointer;
            font-size: 1rem;
        }
        
        .btn-primary {
            background: #16a34a;
            color: white;
        }
        
        .btn-primary:hover {
            background: #15803d;
        }
        
        .btn-secondary {
            background: #4b5563;
            color: white;
        }
        
        .btn-secondary:hover {
            background: #374151;
        }
        
        .footer {
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid #374151;
            color: #9ca3af;
            font-size: 0.875rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
        </div>

        <h1>Сайт временно недоступен</h1>

        <p class="description">
            Не удается подключиться к серверу.             Возможные причины:
        </p>

        <div class="reasons">
            <ul>
                <li>
                    <span class="bullet">•</span>
                    <span>Проблемы с интернет-соединением</span>
                </li>
                <li>
                    <span class="bullet">•</span>
                    <span>Сервер временно недоступен</span>
                </li>
                <li>
                    <span class="bullet">•</span>
                    <span>Блокировка провайдером или РКН</span>
                </li>
                <li>
                    <span class="bullet">•</span>
                    <span>Технические работы на сервере</span>
                </li>
            </ul>
        </div>

        <div class="solutions">
            <h2>Что можно сделать:</h2>
            <ol>
                <li>
                    <span class="number">1.</span>
                    <span>Проверьте интернет-соединение</span>
                </li>
                <li>
                    <span class="number">2.</span>
                    <span>Попробуйте обновить страницу через несколько минут</span>
                </li>
                <li>
                    <span class="number">3.</span>
                    <span>Используйте VPN, если сайт заблокирован</span>
                </li>
                <li>
                    <span class="number">4.</span>
                    <span>Запустите локальную копию сайта (инструкция ниже)</span>
                </li>
            </ol>
        </div>

        <div class="local-setup">
            <h2>Запуск локальной копии:</h2>
            <p style="color: #d1d5db; margin-bottom: 0.75rem; font-size: 0.875rem;">
                Если основной сайт недоступен, вы можете запустить собственную копию:
            </p>
            <div class="code-block">
                <div class="command">git clone https://github.com/b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0/modrinth-proxy.git</div>
                <div class="command">cd modrinth-proxy</div>
                <div class="command">npm install</div>
                <div class="command">npm run dev</div>
            </div>
            <p style="color: #9ca3af; font-size: 0.75rem;">
                Сайт будет доступен по адресу <code style="background: #374151; padding: 0.25rem 0.5rem; border-radius: 0.25rem;">http://localhost:3000</code>
            </p>
        </div>

        <div class="buttons">
            <button onclick="window.location.reload()" class="btn btn-primary">
                Попробовать снова
            </button>
            <a href="/" class="btn btn-secondary">
                На главную
            </a>
        </div>

        <div class="footer">
            <p>
                Если проблема повторяется, возможно сайт заблокирован в вашем регионе.
                <br />
                В этом случае используйте VPN или запустите локальную копию.
            </p>
        </div>
    </div>
</body>
</html>`

  return new NextResponse(offlineHtml, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Last-Modified': new Date().toUTCString(),
    },
  })
}
