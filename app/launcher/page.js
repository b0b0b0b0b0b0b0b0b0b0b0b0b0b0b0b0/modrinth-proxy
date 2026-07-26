import DownloadButtons from './DownloadButtons'
import LauncherVersions from './LauncherVersions'
import LauncherLastUpdate from './LauncherLastUpdate'
import DetectedOS from './DetectedOS'
import { DownloadSection } from './download-section-replacement'
import { getLauncherData } from '@/lib/launcher'
import { getAstralRinthData } from '@/lib/astralrinth'

export const metadata = {
  title: 'Modrinth App - Скачать лаунчер',
  description: 'Скачайте официальный лаунчер Modrinth App для Windows, macOS и Linux',
}

export default async function AppPage() {
  const [launcherData, astralData] = await Promise.all([
    getLauncherData(),
    getAstralRinthData(),
  ]);

  return (
    <div className="min-h-screen">
      <div className="relative">
        <div className="landing-hero relative mt-4 mb-16">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="main-header text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-6 text-gray-900 dark:text-white max-w-[60rem] mx-auto leading-tight">
                Скачайте Modrinth App для Windows
              </h1>
              
              <h2 className="main-subheader text-xl md:text-2xl lg:text-3xl text-muted max-w-4xl mx-auto leading-relaxed mb-10">
                Скачайте Modrinth App — бесплатный лаунчер Minecraft с открытым исходным кодом для установки модов, модпаков, шейдеров и ресурспаков. Играйте с любимыми модами и держите их в актуальном состоянии — всё в одном удобном приложении.
              </h2>

              <DownloadButtons launcherData={launcherData} />

              <div className="relative max-w-5xl mx-auto mt-16">
                <img 
                  src="https://cdn-raw.modrinth.com/app-landing/app-screenshot.webp" 
                  alt="Modrinth App Screenshot"
                  className="w-full h-auto"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="features-section max-w-7xl mx-auto">
        <h1 className="subheader text-4xl md:text-5xl lg:text-6xl font-black text-center mb-16 bg-gradient-to-r from-modrinth-green via-blue-400 to-purple-400 bg-clip-text text-transparent">
          Не похож ни на один лаунчер,<br />который вы использовали раньше
        </h1>

        <div className="feature-grid grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="feature gradient-border bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-3xl p-8 border border-gray-700/50 shadow-2xl">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Управление модами</h3>
              <p className="text-gray-600 dark:text-gray-400">Modrinth упрощает управление всеми вашими модами в одном месте. Вы можете устанавливать, удалять и обновлять моды одним кликом.</p>
            </div>
          </div>

          <div className="feature gradient-border bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-3xl p-8 border border-gray-700/50 shadow-2xl">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Играйте с любимыми модами</h3>
              <p className="text-gray-600 dark:text-gray-400">Используйте Modrinth App для скачивания и игры с вашими любимыми модами и модпаками.</p>
            </div>
          </div>

          <div className="feature gradient-border bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-3xl p-8 border border-gray-700/50 shadow-2xl">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Делитесь модпаками</h3>
              <p className="text-gray-600 dark:text-gray-400">Создавайте, делитесь и играйте в модпаки с любыми из тысяч модов и модпаков, размещенных здесь на Modrinth.</p>
            </div>
          </div>

          <div className="feature gradient-border bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-3xl p-8 border border-gray-700/50 shadow-2xl">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Производительность</h3>
              <p className="text-gray-600 dark:text-gray-400">Modrinth App работает лучше, чем многие ведущие менеджеры модов, используя всего 150 МБ оперативной памяти!</p>
            </div>
          </div>

          <div className="feature gradient-border bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-3xl p-8 border border-gray-700/50 shadow-2xl">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Интеграция с сайтом</h3>
              <p className="text-gray-600 dark:text-gray-400">Modrinth App полностью интегрирован с сайтом, поэтому вы можете получить доступ ко всем вашим любимым проектам из приложения!</p>
            </div>
          </div>

          <div className="feature gradient-border bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-3xl p-8 border border-gray-700/50 shadow-2xl">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Импорт профилей</h3>
              <p className="text-gray-600 dark:text-gray-400">Импортируйте все ваши любимые профили из лаунчера, который вы использовали раньше, и начните работу с Modrinth App за секунды!</p>
            </div>
          </div>
        </div>

        <div className="feature-row grid md:grid-cols-3 gap-8 mt-16">
          <div className="point text-center">
            <div className="title flex flex-col items-center gap-4 mb-4">
              <svg className="w-12 h-12 text-modrinth-green" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M21 8.25C21 8.70312 20.9258 9.13281 20.7773 9.53906C20.6289 9.94531 20.4141 10.3125 20.1328 10.6406C19.8516 10.9688 19.5273 11.2461 19.1602 11.4727C18.793 11.6992 18.3828 11.8516 17.9297 11.9297C17.8438 12.375 17.6914 12.7852 17.4727 13.1602C17.2539 13.5352 16.9766 13.8594 16.6406 14.1328C16.3047 14.4062 15.9375 14.6172 15.5391 14.7656C15.1406 14.9141 14.7109 14.9922 14.25 15H9.75C9.5 15 9.26172 15.0391 9.03516 15.1172C8.80859 15.1953 8.60156 15.3047 8.41406 15.4453C8.22656 15.5859 8.0625 15.7539 7.92188 15.9492C7.78125 16.1445 7.67578 16.3633 7.60547 16.6055C8.02734 16.707 8.41406 16.8711 8.76562 17.0977C9.11719 17.3242 9.42188 17.6016 9.67969 17.9297C9.9375 18.2578 10.1367 18.6172 10.2773 19.0078C10.418 19.3984 10.4922 19.8125 10.5 20.25C10.5 20.7656 10.4023 21.25 10.207 21.7031C10.0117 22.1562 9.74219 22.5547 9.39844 22.8984C9.05469 23.2422 8.65625 23.5117 8.20312 23.707C7.75 23.9023 7.26562 24 6.75 24C6.23438 24 5.75 23.9023 5.29688 23.707C4.84375 23.5117 4.44531 23.2461 4.10156 22.9102C3.75781 22.5742 3.48828 22.1758 3.29297 21.7148C3.09766 21.2539 3 20.7656 3 20.25C3 19.8047 3.07422 19.3789 3.22266 18.9727C3.37109 18.5664 3.57812 18.2031 3.84375 17.8828C4.10938 17.5625 4.42578 17.2852 4.79297 17.0508C5.16016 16.8164 5.5625 16.6602 6 16.582V7.41797C5.5625 7.33203 5.16016 7.17578 4.79297 6.94922C4.42578 6.72266 4.10938 6.44922 3.84375 6.12891C3.57812 5.80859 3.37109 5.44141 3.22266 5.02734C3.07422 4.61328 3 4.1875 3 3.75C3 3.23438 3.09766 2.75 3.29297 2.29688C3.48828 1.84375 3.75391 1.44922 4.08984 1.11328C4.42578 0.777344 4.82422 0.507812 5.28516 0.304688C5.74609 0.101562 6.23438 0 6.75 0C7.26562 0 7.75 0.0976563 8.20312 0.292969C8.65625 0.488281 9.05078 0.757812 9.38672 1.10156C9.72266 1.44531 9.99219 1.84375 10.1953 2.29688C10.3984 2.75 10.5 3.23438 10.5 3.75C10.5 4.19531 10.4258 4.62109 10.2773 5.02734C10.1289 5.43359 9.92188 5.79688 9.65625 6.11719C9.39062 6.4375 9.07422 6.71484 8.70703 6.94922C8.33984 7.18359 7.9375 7.33984 7.5 7.41797V14.2734C7.82812 14.0234 8.18359 13.832 8.56641 13.6992C8.94922 13.5664 9.34375 13.5 9.75 13.5H14.25C14.5 13.5 14.7383 13.4609 14.9648 13.3828C15.1914 13.3047 15.3984 13.1953 15.5859 13.0547C15.7734 12.9141 15.9375 12.7461 16.0781 12.5508C16.2188 12.3555 16.3242 12.1367 16.3945 11.8945C15.9727 11.793 15.5859 11.6289 15.2344 11.4023C14.8828 11.1758 14.5781 10.9023 14.3203 10.582C14.0625 10.2617 13.8633 9.90234 13.7227 9.50391C13.582 9.10547 13.5078 8.6875 13.5 8.25C13.5 7.73438 13.5977 7.25 13.793 6.79688C13.9883 6.34375 14.2539 5.94922 14.5898 5.61328C14.9258 5.27734 15.3242 5.00781 15.7852 4.80469C16.2461 4.60156 16.7344 4.5 17.25 4.5C17.7656 4.5 18.25 4.59766 18.7031 4.79297C19.1562 4.98828 19.5508 5.25781 19.8867 5.60156C20.2227 5.94531 20.4922 6.34375 20.6953 6.79688C20.8984 7.25 21 7.73438 21 8.25ZM4.5 3.75C4.5 4.0625 4.55859 4.35547 4.67578 4.62891C4.79297 4.90234 4.95312 5.14062 5.15625 5.34375C5.35938 5.54688 5.59766 5.70703 5.87109 5.82422C6.14453 5.94141 6.4375 6 6.75 6C7.0625 6 7.35547 5.94141 7.62891 5.82422C7.90234 5.70703 8.14062 5.54688 8.34375 5.34375C8.54688 5.14062 8.70703 4.90234 8.82422 4.62891C8.94141 4.35547 9 4.0625 9 3.75C9 3.4375 8.94141 3.14453 8.82422 2.87109C8.70703 2.59766 8.54688 2.35938 8.34375 2.15625C8.14062 1.95312 7.90234 1.79297 7.62891 1.67578C7.35547 1.55859 7.0625 1.5 6.75 1.5C6.4375 1.5 6.14453 1.55859 5.87109 1.67578C5.59766 1.79297 5.35938 1.95312 5.15625 2.15625C4.95312 2.35938 4.79297 2.59766 4.67578 2.87109C4.55859 3.14453 4.5 3.4375 4.5 3.75ZM9 20.25C9 19.9375 8.94141 19.6445 8.82422 19.3711C8.70703 19.0977 8.54688 18.8594 8.34375 18.6562C8.14062 18.4531 7.90234 18.293 7.62891 18.1758C7.35547 18.0586 7.0625 18 6.75 18C6.4375 18 6.14453 18.0586 5.87109 18.1758C5.59766 18.293 5.35938 18.4531 5.15625 18.6562C4.95312 18.8594 4.79297 19.0977 4.67578 19.3711C4.55859 19.6445 4.5 19.9375 4.5 20.25C4.5 20.5625 4.55859 20.8555 4.67578 21.1289C4.79297 21.4023 4.95312 21.6406 5.15625 21.8438C5.35938 22.0469 5.59766 22.207 5.87109 22.3242C6.14453 22.4414 6.4375 22.5 6.75 22.5C7.0625 22.5 7.35547 22.4414 7.62891 22.3242C7.90234 22.207 8.14062 22.0469 8.34375 21.8438C8.54688 21.6406 8.70703 21.4023 8.82422 21.1289C8.94141 20.8555 9 20.5625 9 20.25ZM17.25 10.5C17.5625 10.5 17.8555 10.4414 18.1289 10.3242C18.4023 10.207 18.6406 10.0469 18.8438 9.84375C19.0469 9.64062 19.207 9.40234 19.3242 9.12891C19.4414 8.85547 19.5 8.5625 19.5 8.25C19.5 7.9375 19.4414 7.64453 19.3242 7.37109C19.207 7.09766 19.0469 6.85938 18.8438 6.65625C18.6406 6.45312 18.4023 6.29297 18.1289 6.17578C17.8555 6.05859 17.5625 6 17.25 6C16.9375 6 16.6445 6.05859 16.3711 6.17578C16.0977 6.29297 15.8594 6.45312 15.6562 6.65625C15.4531 6.85938 15.293 7.09766 15.1758 7.37109C15.0586 7.64453 15 7.9375 15 8.25C15 8.5625 15.0586 8.85547 15.1758 9.12891C15.293 9.40234 15.4531 9.64062 15.6562 9.84375C15.8594 10.0469 16.0977 10.207 16.3711 10.3242C16.6445 10.4414 16.9375 10.5 17.25 10.5Z" fill="url(#paint0_linear_897_3796)"></path>
                <defs>
                  <linearGradient id="paint0_linear_897_3796" x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#C1E1B1"></stop>
                    <stop offset="1" stopColor="#A7BDE6"></stop>
                  </linearGradient>
                </defs>
              </svg>
              <h3 className="text-2xl font-bold text-white">Открытый исходный код</h3>
            </div>
            <div className="description text-gray-600 dark:text-gray-400">
              Лаунчер Modrinth полностью открыт. Вы можете просмотреть исходный код на нашем{' '}
              <a href="https://github.com/modrinth/code" rel="noopener" target="_blank" className="text-modrinth-green hover:underline">GitHub</a>!
            </div>
          </div>

          <div className="point text-center">
            <div className="title flex flex-col items-center gap-4 mb-4">
              <svg className="w-12 h-12 text-modrinth-green" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <g clipPath="url(#clip0_897_3802)">
                  <path d="M4.39313 8.58984C2.31984 9.28359 0.75 10.9266 0.75 13.5C0.75 16.5938 3.28125 18.75 6.375 18.75H15.0173M21.9291 17.7066C22.7456 17.0297 23.25 16.013 23.25 14.625C23.25 11.8209 20.7656 10.605 18.75 10.5C18.3333 6.30281 15.4219 3.75 12 3.75C10.7738 3.75 9.71297 4.07484 8.83125 4.60031" stroke="url(#paint0_linear_897_3802)" strokeWidth="2.34783" strokeLinecap="round" strokeLinejoin="round"></path>
                  <path d="M21 21L3 3" stroke="url(#paint1_linear_897_3802)" strokeWidth="2.34783" strokeMiterlimit="10" strokeLinecap="round"></path>
                </g>
                <defs>
                  <linearGradient id="paint0_linear_897_3802" x1="12" y1="3.75" x2="12" y2="18.75" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#C1E1B1"></stop>
                    <stop offset="1" stopColor="#A7BDE6"></stop>
                  </linearGradient>
                  <linearGradient id="paint1_linear_897_3802" x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#C1E1B1"></stop>
                    <stop offset="1" stopColor="#A7BDE6"></stop>
                  </linearGradient>
                  <clipPath id="clip0_897_3802">
                    <rect width="24" height="24" fill="white"></rect>
                  </clipPath>
                </defs>
              </svg>
              <h3 className="text-2xl font-bold text-white">Офлайн режим</h3>
            </div>
            <div className="description text-gray-600 dark:text-gray-400">
              Играйте в свои моды, подключены ли вы к интернету или нет.
            </div>
          </div>

          <div className="point text-center">
            <div className="title flex flex-col items-center gap-4 mb-4">
              <svg className="w-12 h-12 text-modrinth-green" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M22.8533 11.7089C22.8205 11.6379 22.0264 9.94977 20.2611 8.25801C17.9089 6.00383 14.938 4.8125 11.668 4.8125C8.39796 4.8125 5.42702 6.00383 3.07483 8.25801C1.30952 9.94977 0.51171 11.6406 0.482647 11.7089C0.440003 11.8008 0.417969 11.9003 0.417969 12.0009C0.417969 12.1015 0.440003 12.201 0.482647 12.2929C0.51546 12.3639 1.30952 14.0511 3.07483 15.7429C5.42702 17.9962 8.39796 19.1875 11.668 19.1875C14.938 19.1875 17.9089 17.9962 20.2611 15.7429C22.0264 14.0511 22.8205 12.3639 22.8533 12.2929C22.8959 12.201 22.918 12.1015 22.918 12.0009C22.918 11.9003 22.8959 11.8008 22.8533 11.7089ZM11.668 17.75C8.78234 17.75 6.2614 16.7446 4.17452 14.7627C3.31825 13.9466 2.58976 13.0161 2.01171 12C2.58961 10.9838 3.31811 10.0532 4.17452 9.2373C6.2614 7.25535 8.78234 6.25 11.668 6.25C14.5536 6.25 17.0745 7.25535 19.1614 9.2373C20.0193 10.053 20.7494 10.9836 21.3289 12C20.653 13.2093 17.7083 17.75 11.668 17.75ZM11.668 7.6875C10.7779 7.6875 9.90792 7.94042 9.16789 8.41429C8.42787 8.88815 7.8511 9.56167 7.5105 10.3497C7.16991 11.1377 7.08079 12.0048 7.25443 12.8413C7.42806 13.6779 7.85664 14.4463 8.48598 15.0494C9.11532 15.6525 9.91714 16.0632 10.7901 16.2296C11.663 16.396 12.5678 16.3106 13.39 15.9842C14.2123 15.6578 14.9151 15.1051 15.4096 14.3959C15.904 13.6867 16.168 12.8529 16.168 12C16.1667 10.8566 15.6922 9.76041 14.8486 8.95192C14.0049 8.14342 12.8611 7.68869 11.668 7.6875ZM11.668 14.875C11.0746 14.875 10.4946 14.7064 10.0012 14.3905C9.5079 14.0746 9.12338 13.6256 8.89632 13.1002C8.66926 12.5749 8.60985 11.9968 8.7256 11.4391C8.84136 10.8814 9.12708 10.3691 9.54664 9.96707C9.9662 9.56499 10.5007 9.29117 11.0827 9.18024C11.6646 9.06931 12.2678 9.12624 12.816 9.34385C13.3642 9.56145 13.8327 9.92994 14.1624 10.4027C14.492 10.8755 14.668 11.4314 14.668 12C14.668 12.7625 14.3519 13.4938 13.7893 14.0329C13.2267 14.5721 12.4636 14.875 11.668 14.875Z" fill="url(#paint0_linear_897_3809)"></path>
                <defs>
                  <linearGradient id="paint0_linear_897_3809" x1="11.668" y1="4.8125" x2="11.668" y2="19.1875" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#C1E1B1"></stop>
                    <stop offset="1" stopColor="#A7BDE6"></stop>
                  </linearGradient>
                </defs>
              </svg>
              <h3 className="text-2xl font-bold text-white">Отслеживание проектов</h3>
            </div>
            <div className="description text-gray-600 dark:text-gray-400">
              Сохраняйте контент, который вам нравится, и получайте обновления одним кликом.
            </div>
          </div>
        </div>
      </div>

      <LauncherVersions />

      <div className="max-w-6xl mx-auto px-4 py-8" id="download-options">

        <div className="mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Варианты загрузки</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">Выберите версию для вашей операционной системы</p>
            <DetectedOS />
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
            <DownloadSection launcherData={launcherData} astralData={astralData} />
          </div>
        </div>

        <div className="feature gradient-border bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-3xl p-8 border border-gray-700/50 shadow-2xl">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4 max-w-3xl mx-auto">
            modrinth.black is an independent project and has no relation to the original Modrinth and Rinth, Inc. Modrinth App is a product of Rinth, Inc. All rights to Modrinth App belong to Rinth, Inc.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4 max-w-3xl mx-auto">
            Все ссылки для скачивания берутся напрямую с официальных серверов Modrinth.
            <br />
            Подробнее о проекте:{' '}
            <a href="/bmadnco" className="text-modrinth-green hover:underline">
              Как это работает
            </a>
          </p>

          <div className="mt-6 flex flex-col items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              RAW API
            </span>
            <LauncherLastUpdate launcherData={launcherData} astralData={astralData} />
          </div>
        </div>
      </div>
    </div>
  )
}
