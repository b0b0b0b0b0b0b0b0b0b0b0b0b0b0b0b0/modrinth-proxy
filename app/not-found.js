import Link from 'next/link'

export const metadata = {
  title: '404 - Страница не найдена | ModrinthProxy',
  description: 'Запрашиваемая страница не найдена',
}

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        <div className="mb-8 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-red-500/20 rounded-full animate-ping"></div>
          </div>
          <div className="relative">
            <svg 
              className="w-32 h-32 mx-auto text-red-500 animate-bounce" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ animationDuration: '2s' }}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
        </div>

        <h1 className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 bg-clip-text text-transparent animate-pulse">
          404
        </h1>
        
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Упс! Страница не найдена
        </h2>
        
        <p className="text-gray-400 text-base md:text-lg mb-8 max-w-md mx-auto">
          Похоже, эта страница отправилась в Край вместе с Эндерменом. 
          Возможно, она была удалена или никогда не существовала.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href="/"
            className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/50 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="relative z-10">На главную</span>
          </Link>
          
          <Link 
            href="/mods"
            className="group inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 border border-gray-700 hover:border-modrinth-green"
          >
            <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>К модам</span>
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <p className="text-gray-500 text-sm mb-4">Или перейдите в популярные разделы:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/plugins" className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-all duration-200 border border-gray-700 hover:border-modrinth-green">
              Плагины
            </Link>
            <Link href="/modpacks" className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-all duration-200 border border-gray-700 hover:border-modrinth-green">
              Модпаки
            </Link>
            <Link href="/shaders" className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-all duration-200 border border-gray-700 hover:border-modrinth-green">
              Шейдеры
            </Link>
            <Link href="/resourcepacks" className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-all duration-200 border border-gray-700 hover:border-modrinth-green">
              Ресурспаки
            </Link>
            <Link href="/datapacks" className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-all duration-200 border border-gray-700 hover:border-modrinth-green">
              Датапаки
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
