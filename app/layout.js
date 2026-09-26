import './globals.css'
import { Nunito } from "next/font/google"
import Script from 'next/script'
import { Suspense } from 'react'
import { cookies, headers } from 'next/headers'
import { ThemeProvider } from 'next-themes'
import MobileNav from './components/MobileNav'
import Navigation from './components/Navigation'
import TopNav from "./components/TopNav"
import Footer from './components/Footer'
import Logo from './components/Logo'
import VersionsPreloader from './components/VersionsPreloader'
import AppTooltipProvider from './components/AppTooltipProvider'
import ExtensionBanner from './components/ExtensionBanner'
import FeedbackThoughtBanner from './components/FeedbackThoughtBanner'
import HalloweenEffects from './components/HalloweenEffects'
import NewYearEffects from './components/NewYearEffects'
import AppSettingsSync from './components/AppSettingsSync'
import CatalogReturnLifecycle from './components/CatalogReturnLifecycle'
import { I18nProvider } from './components/I18nProvider'
import DisclaimerBadge from './components/DisclaimerBadge'
import { PALETTES } from '../lib/paletteManager'
import { CHUNK_LOAD_RECOVERY_INLINE } from '../lib/chunkLoadRecoveryInline'
import { LOCALE_COOKIE } from '../lib/i18n/config'
import { resolveLocale } from '../lib/i18n/resolveLocale'

const nunito = Nunito({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
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

export default async function RootLayout({ children }) {
  const locale = resolveLocale(
    cookies().get(LOCALE_COOKIE)?.value,
    headers().get('accept-language'),
  )
  const activeColorPalettesStoreDisclaimerUpdate = {}
  for (const key of Object.keys(PALETTES)) {
    activeColorPalettesStoreDisclaimerUpdate[key] = PALETTES[key].variables
  }

  return (
    <html lang={locale} className={`scroll-smooth ${nunito.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: CHUNK_LOAD_RECOVERY_INLINE }}
        />
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
    console.log("%c🐉","padding:50px 0px;font-size:300px;color:transparent;text-shadow:0 0 0 #22b369");
    console.log("%cСтоп-стоп-стоп!", "color: #1a9456; font-size: 70px; font-weight: bold;");
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
          <I18nProvider locale={locale}>
          <AppSettingsSync />
          <CatalogReturnLifecycle />
          <noscript dangerouslySetInnerHTML={{ __html: '<div><img src="https://mc.yandex.ru/watch/105182235" style="position:absolute; left:-9999px;" alt="" /></div>' }} />
          <VersionsPreloader />
          <TopNav />
          <nav className="relative z-10 hidden lg:block">
            <div className="container mx-auto px-4 py-3 md:py-4">
              <div className="flex min-w-0 items-center gap-4 md:gap-6">
                <Suspense fallback={<div className="w-9 h-9 flex-shrink-0"></div>}>
                  <Logo />
                </Suspense>
                <Suspense fallback={null}>
                  <Navigation />
                </Suspense>
              </div>
            </div>
          </nav>
          <DisclaimerBadge />
          <main className="container">
            {children}
          </main>
          <Suspense fallback={null}>
            <MobileNav />
          </Suspense>
          <Footer />
          <ExtensionBanner />
          <FeedbackThoughtBanner />
          <HalloweenEffects />
          <NewYearEffects />
          </I18nProvider>
          </AppTooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
