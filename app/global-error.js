'use client'

function isChunkFailure(error) {
  const message = error?.message || ''
  const name = error?.name || ''
  return (
    name === 'ChunkLoadError' ||
    message.includes('ChunkLoadError') ||
    message.includes('Loading chunk') ||
    message.includes('ERR_HTTP2_PROTOCOL_ERROR') ||
    message.includes('Failed to fetch dynamically imported module')
  )
}

export default function GlobalError({ error, reset }) {
  if (typeof window !== 'undefined' && isChunkFailure(error)) {
    const url = new URL(window.location.href)
    const count = Number(sessionStorage.getItem('next-chunk-reload-count') || '0')
    if (count < 3) {
      sessionStorage.setItem('next-chunk-reload-count', String(count + 1))
      url.searchParams.set('_cr', String(Date.now()))
      window.location.replace(url.toString())
      return null
    }
  }

  return (
    <html lang="ru">
      <body className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-2xl font-bold">Что-то пошло не так</h2>
          <p className="text-gray-400 text-sm">
            Страница не загрузилась. Обычно помогает обновление — особенно сразу после деплоя.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg font-semibold"
              style={{ backgroundColor: '#1bd96a', color: '#000' }}
            >
              Перезагрузить
            </button>
            <button
              type="button"
              onClick={() => reset()}
              className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
