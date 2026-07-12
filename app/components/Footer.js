export default function Footer() {
  return (
    <footer className="relative mb-20 lg:mb-0 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-modrinth-green to-transparent opacity-50"></div>
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-modrinth-green/30 to-transparent blur-sm"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-modrinth-darker via-black to-black"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-modrinth-green/5 via-transparent to-modrinth-green-light/5"></div>
      <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '50px 50px', transform: 'skewY(-2deg) translateY(10px)'}}></div>
      <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(var(--color-green-rgb),0.03) 1px, transparent 0)', backgroundSize: '35px 35px', transform: 'skewX(3deg)'}}></div>
      <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, rgba(var(--color-green-light-rgb),0.02) 1.5px, transparent 0)', backgroundSize: '60px 45px', transform: 'rotate(1deg)'}}></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-modrinth-green/10 rounded-full filter blur-3xl opacity-20"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-modrinth-green-light/10 rounded-full filter blur-3xl opacity-20"></div>
      <div className="relative container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8 justify-items-center">
          <div className="text-center md:text-left">
            <h3 className="text-lg font-bold bg-gradient-to-r from-modrinth-green to-modrinth-green-light bg-clip-text text-transparent mb-3 select-none">
              ModrinthProxy
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Делаем Minecraft лучше для каждого игрока. 
              Моды, шейдеры, плагины — всё, что нужно для идеальной игры.
              <br/>
              <span className="text-modrinth-green/80 font-medium">Minecraft в каждый дом.</span>
            </p>
          </div>

          <div className="text-center md:text-left">
            <h3 className="text-lg font-bold text-white mb-3">
              Полностью открытый проект
            </h3>
            <a 
              href="https://github.com/b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0/modrinth-proxy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all duration-300 group text-sm font-medium shadow-lg hover:shadow-modrinth-green/20 hover:scale-95"
            >
              <svg className="w-5 h-5 shrink-0 text-modrinth-green group-hover:text-modrinth-green-light transition-all duration-300 group-hover:-rotate-12" fill="currentColor" viewBox="0 0 475.084 475.084" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" aria-hidden>
                <g>
                  <g>
                    <path d="M436.244,146.752c5.14-15.422,7.713-31.409,7.713-47.967c0-22.08-4.859-42.828-14.564-62.242
                      c-20.362,0-38.349,3.715-53.961,11.136c-15.604,7.423-33.4,18.938-53.379,34.545c-25.122-6.09-51.777-9.135-79.941-9.135
                      c-30.837,0-60.245,3.333-88.223,9.994c-20.364-15.99-38.351-27.74-53.959-35.26c-15.608-7.52-33.689-11.279-54.247-11.279
                      c-9.707,19.414-14.56,40.163-14.56,62.242c0,16.751,2.568,32.93,7.708,48.535C12.942,177.587,0,215.272,0,260.383
                      c0,39.595,5.898,71.092,17.701,94.507c6.283,12.367,14.465,23.312,24.554,32.832c10.085,9.514,21.601,17.228,34.545,23.13
                      c12.946,5.896,25.981,10.801,39.116,14.699c13.134,3.9,27.646,6.758,43.54,8.559c15.893,1.816,29.93,3.004,42.111,3.579
                      c12.181,0.564,25.693,0.853,40.544,0.853c17.508,0,33.396-0.432,47.678-1.283c14.277-0.855,30.594-2.953,48.964-6.276
                      c18.367-3.333,34.547-7.857,48.54-13.565c13.99-5.708,27.412-13.895,40.259-24.551c12.847-10.663,22.884-23.318,30.121-37.976
                      c11.604-23.603,17.412-55.107,17.412-94.507C475.078,215.082,462.135,177.206,436.244,146.752z M401.995,354.455
                      c-6.092,12.471-13.802,22.265-23.127,29.41c-9.329,7.139-20.938,12.847-34.831,17.135c-13.9,4.281-27.217,7.087-39.971,8.415
                      c-12.758,1.334-26.933,1.998-42.545,1.998h-47.966c-15.607,0-29.79-0.664-42.541-1.998c-12.752-1.328-26.075-4.134-39.971-8.415
                      c-13.891-4.288-25.5-9.996-34.829-17.135c-9.329-7.146-17.037-16.939-23.128-29.41c-6.09-12.471-9.136-27.076-9.136-43.824
                      c0-22.847,6.567-42.264,19.702-58.245c13.134-15.99,30.929-23.982,53.387-23.982c8.188,0,26.746,1.997,55.677,5.995
                      c13.513,2.093,28.456,3.14,44.823,3.14c16.372,0,31.313-1.044,44.824-3.14c29.317-3.999,47.869-5.995,55.678-5.995
                      c22.457,0,40.252,7.996,53.386,23.982c13.135,15.988,19.698,35.398,19.698,58.245
                      C411.125,327.382,408.079,341.995,401.995,354.455z"></path>
                    <path d="M166.875,265.52c-5.806-6.475-12.703-9.712-20.699-9.712c-7.998,0-14.896,3.241-20.701,9.712
                      c-5.802,6.468-9.897,13.703-12.275,21.689c-2.383,8.002-3.571,15.804-3.571,23.422c0,7.61,1.191,15.413,3.571,23.414
                      c2.375,7.991,6.468,15.222,12.275,21.689c5.808,6.475,12.703,9.713,20.701,9.713c7.996,0,14.896-3.244,20.699-9.713
                      c5.804-6.468,9.897-13.698,12.275-21.689c2.38-8.001,3.571-15.804,3.571-23.414c0-7.611-1.188-15.42-3.571-23.422
                      C176.771,279.226,172.682,271.994,166.875,265.52z"></path>
                    <path d="M349.601,265.52c-5.804-6.475-12.703-9.712-20.697-9.712c-7.991,0-14.894,3.241-20.701,9.712
                      c-5.804,6.468-9.896,13.703-12.271,21.689c-2.385,8.002-3.576,15.804-3.576,23.422c0,7.61,1.191,15.413,3.576,23.414
                      c2.375,7.991,6.468,15.222,12.271,21.689c5.808,6.475,12.71,9.713,20.701,9.713c7.994,0,14.894-3.244,20.697-9.713
                      c5.801-6.468,9.896-13.698,12.278-21.689c2.379-8.001,3.569-15.804,3.569-23.414c0-7.611-1.19-15.42-3.569-23.422
                      C359.498,279.226,355.402,271.994,349.601,265.52z"></path>
                  </g>
                </g>
              </svg>
              <span>Open Source</span>
              <svg className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"></path>
              </svg>
            </a>
            <div className="mt-4">
              <p className="text-gray-400 text-sm leading-relaxed">
                Нашли баг? Есть предложения? 
                <br/>
                <a href="https://github.com/b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0/modrinth-proxy/issues" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-modrinth-green hover:text-modrinth-green-light transition-colors font-medium group">
                  <span>GitHub Issues</span>
                  <svg className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"></path>
                  </svg>
                </a>
              </p>
            </div>
          </div>

          <div className="text-center md:text-left">
            <h3 className="text-lg font-bold text-white mb-3">
              О проекте
            </h3>
            <div className="flex flex-col gap-2 items-center md:items-start">
              <a href="/bmadnco" className="flex items-center justify-center md:justify-start gap-2 text-gray-400 hover:text-modrinth-green text-sm transition-colors group">
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Как это работает</span>
              </a>
              <a href="/protect-bot" className="flex items-center justify-center md:justify-start gap-2 text-gray-400 hover:text-modrinth-green text-sm transition-colors group">
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="font-medium">Что за бот у вас?</span>
              </a>
              <a href="/file-lookup" className="flex items-center justify-center md:justify-start gap-2 text-gray-400 hover:text-modrinth-green text-sm transition-colors group">
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="font-medium">Поиск файла по хешу</span>
              </a>
              <a href="/extension" className="flex items-center justify-center md:justify-start gap-2 text-gray-400 hover:text-modrinth-green text-sm transition-colors group">
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="font-medium">Браузерное расширение</span>
              </a>
              <a href="/app" className="flex items-center justify-center md:justify-start gap-2 text-gray-400 hover:text-modrinth-green text-sm transition-colors group">
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4-4 4m0 0-4-4m4 4V4" />
                </svg>
                <span className="font-medium">Modrinth App</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 mt-8">
          <div className="flex items-center justify-center">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-modrinth-green/20 via-modrinth-green-light/20 to-modrinth-green/20 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
              <div className="relative flex items-center gap-3 px-4 py-3 bg-black/40 backdrop-blur-sm rounded-2xl">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-modrinth-green/10 border border-modrinth-green/20">
                  <svg className="w-5 h-5 text-modrinth-green/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">
                    Disclaimer
                  </p>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">
                    Not an official Minecraft service. Not approved by or associated with Mojang or Microsoft.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
