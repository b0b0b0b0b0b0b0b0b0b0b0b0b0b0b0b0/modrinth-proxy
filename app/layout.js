import './globals.css'
import { Nunito } from "next/font/google"
import Script from 'next/script'
import { Suspense } from 'react'
import Link from 'next/link'
import { ThemeProvider } from 'next-themes'
import MobileNav from './components/MobileNav'
import Navigation from './components/Navigation'
import TopNav from "./components/TopNav"
import Footer from './components/Footer'
import Logo from './components/Logo'
import VersionsPreloader from './components/VersionsPreloader'
import AppTooltipProvider from './components/AppTooltipProvider'
import ExtensionBanner from './components/ExtensionBanner'
import AppSettingsSync from './components/AppSettingsSync'
import ChunkLoadRecovery from './components/ChunkLoadRecovery'
import { PALETTES } from '../lib/paletteManager'

const nunito = Nunito({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-nunito',
  display: 'swap',
  preload: false,
  adjustFontFallback: true,
  fallback: ['system-ui', 'arial'],
})

export const metadata = {
  title: 'ModrinthProxy',
  description: 'Удобный поиск и скачивание модов, плагинов, шейдеров для Minecraft на русском языке',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.png?v=2',
    apple: '/icon.png?v=2',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ec7fab',
}

const POSTERITY_COMMENT_BODY = ` _    _ 
    (o)--(o)      
   /\.______\.       
   \\________/     
  ./        \\.    
 ( .        , )
  \\ \\_\\\\ //_/ /
   ~~  ~~  ~~`

export default function RootLayout({ children }) {
  const activeColorPalettesStoreDisclaimerUpdate = {}
  for (const key of Object.keys(PALETTES)) {
    activeColorPalettesStoreDisclaimerUpdate[key] = PALETTES[key].variables
  }

  return (
    <html lang="ru" className={`scroll-smooth ${nunito.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('advanced-rendering') === 'false') {
                  document.documentElement.classList.add('no-advanced-rendering');
                }
                if (localStorage.getItem('search-sidebar-right') === 'true') {
                  document.documentElement.classList.add('search-sidebar-right');
                }
                if (localStorage.getItem('project-sidebar-left') === 'true') {
                  document.documentElement.classList.add('project-sidebar-left');
                }
                if (localStorage.getItem('show-disclaimer-badge') === 'false') {
                  document.documentElement.classList.add('hide-disclaimer-badge');
                }
                (function() {
                  var p = localStorage.getItem('color-palette') || 'pink';
                  var m = ${JSON.stringify(activeColorPalettesStoreDisclaimerUpdate)};
                  var v = m[p] || m.pink;
                  for (var k in v) {
                    document.documentElement.style.setProperty(k, v[k]);
                  }
                })();
              } catch (e) {}
            `
          }}
        />
        <Script id="__posterity" strategy="beforeInteractive">
          {`(function(){var h=document.documentElement,t=${JSON.stringify(POSTERITY_COMMENT_BODY)},c=document.createComment(t),f=h.firstChild;if(f)h.insertBefore(c,f);else h.appendChild(c);var s=document.currentScript||document.getElementById("__posterity");if(s&&s.parentNode)s.parentNode.removeChild(s);})();`}
        </Script>
        <link rel="apple-touch-icon" href="/icon.png?v=2" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`(function(m,e,t,r,i,k,a){
            m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
          })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=105182235', 'ym');
          ym(105182235, 'init', {ssr:true, clickmap:true, ecommerce:"dataLayer", accurateTrackBounce:true, trackLinks:true});`}
        </Script>
        <Script id="console-devtools-hint" strategy="afterInteractive">
          {`(function(){
  function warn(){
    console.log("%c🐉","padding:50px 0px;font-size:300px;color:transparent;text-shadow:0 0 0 #1bd070");
    console.log("%cСтоп-стоп-стоп!", "color: #2ca267; font-size: 70px; font-weight: bold;");
    console.log("%cНе вставляйте в это окошко ничего. Это очень опасно!", "color: #d6d6d6; font-size: 21px;");
    console.log("%cЕсли вас кто-то попросил сюда вставить что-то, сообщите незамедлительно об этом администрации сайта! ", "color: red; font-size: 21px;");
  }
  if (document.readyState === "complete") warn();
  else window.addEventListener("load", warn);
})();`}
        </Script>
      </head>
      <body className={`${nunito.className} min-h-screen m-0`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange
          storageKey="modrinth-theme"
        >
          <AppTooltipProvider>
          <AppSettingsSync />
          <ChunkLoadRecovery />
          <noscript dangerouslySetInnerHTML={{ __html: '<div><img src="https://mc.yandex.ru/watch/105182235" style="position:absolute; left:-9999px;" alt="" /></div>' }} />
          <VersionsPreloader />
          <TopNav />
          <nav className="relative z-10 hidden lg:block">
            <div className="container mx-auto px-4 py-3 md:py-4">
              <div className="flex items-center gap-4 md:gap-6">
                <Suspense fallback={<div className="w-9 h-9 flex-shrink-0"></div>}>
                  <Logo />
                </Suspense>
                <Navigation />
              </div>
            </div>
          </nav>
          <div className="relative z-10 flex justify-center pb-2 -mt-1 rounded-b-2xl pt-[5px]">
            <div className="disclaimer-badge">
              <svg className="w-3 h-3 flex-shrink-0 relative z-10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="relative z-10">Unofficial site, not affiliated with modrinth.com.</span>
              <Link href="/bmadnco" className="relative z-10 font-semibold transition-colors duration-200">What is this?</Link>
            </div>
          </div>
          <main className="container">
            {children}
          </main>
          <MobileNav />
          <Footer />
          <ExtensionBanner />
          </AppTooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
