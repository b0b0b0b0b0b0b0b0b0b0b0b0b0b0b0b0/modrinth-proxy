import { BLACKLIST_PROJECTS, BLACKLIST_ORGANIZATIONS, BLACKLIST_PATTERNS, BLACKLIST_AVATARS } from '@/lib/contentFilter'
import EmailCopyButton from '@/app/components/EmailCopyButton'
import TiltCard from '@/app/components/TiltCard'
import TiltCardDirectional from '@/app/components/TiltCardDirectional'
import ProtectionBlock from './ProtectionBlock'
import InfrastructureIcon from './InfrastructureIcon'

export const metadata = {
  title: 'О проекте - ModrinthProxy',
  description: 'Как работает наш сервис и технические детали',
}

function pluralize(count, one, few, many) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod100 >= 11 && mod100 <= 19) return many
  if (mod10 === 1) return one
  if (mod10 >= 2 && mod10 <= 4) return few
  return many
}

export default function AboutPage() {
  const projectsCount = BLACKLIST_PROJECTS.length
  const orgsCount = BLACKLIST_ORGANIZATIONS.length
  const mediaCount = BLACKLIST_PATTERNS.length + BLACKLIST_AVATARS.length

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            <span className="animated-title">
              {'О проекте '.split('').map((char, i) => (
                <span key={i} className={char === ' ' ? 'inline-block w-2' : ''}>{char === ' ' ? '\u00A0' : char}</span>
              ))}
            </span>
            <span className="animated-title title-glow text-modrinth-green">
              {'ModrinthProxy'.split('').map((char, i) => (
                <span key={i}>{char}</span>
              ))}
            </span>
          </h1>
          <p className="text-xl text-gray-400">
            Технические детали и принципы работы
          </p>
        </div>

        <div className="space-y-8 animate-fade-in-up">
          <section className="relative bg-gradient-to-br from-modrinth-green/10 via-gray-900/80 to-purple-900/20 rounded-2xl p-8 md:p-12 border border-modrinth-green/30 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-modrinth-green/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl"></div>
            
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 flex items-center gap-4">
                <div className="p-3 bg-modrinth-green/20 rounded-xl border-2 border-modrinth-green/40">
                  <svg className="w-10 h-10 text-modrinth-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
                </div>
                <span className="text-white drop-shadow-[0_0_20px_rgba(27,217,106,0.3)]">
              Что это такое?
                </span>
            </h2>
              
              <div className="space-y-6">
                <p className="text-xl md:text-2xl text-gray-200 leading-relaxed font-medium">
                  ModrinthProxy — это <span className="text-modrinth-green font-bold">платформа</span> для поиска и скачивания модификаций для Minecraft. 
                  Мы объединяем тысячи модов, плагинов, шейдеров и других материалов в одном удобном месте с русским интерфейсом.
                </p>

                <div className="grid md:grid-cols-2 gap-4 mt-8">
                  <div className="group bg-gradient-to-br from-modrinth-green/5 to-transparent rounded-xl p-5 border border-modrinth-green/20 hover:border-modrinth-green/40 transition-all duration-300 hover:scale-[1.02] cursor-default select-none">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-modrinth-green/20 rounded-lg mt-1">
                        <svg className="w-5 h-5 text-modrinth-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-white mb-1">Каталог контента</h3>
                        <p className="text-sm text-gray-400">Удобный доступ к информации из открытых источников. Мы собираем данные о модификациях и предоставляем их в структурированном виде.</p>
                      </div>
                    </div>
                  </div>

                  <div className="group bg-gradient-to-br from-blue-500/5 to-transparent rounded-xl p-5 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:scale-[1.02] cursor-default select-none">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg mt-1">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-white mb-1">Прямые ссылки</h3>
                        <p className="text-sm text-gray-400">Мы не храним файлы модификаций на наших серверах. Все ссылки ведут напрямую на официальные источники от авторов.</p>
                      </div>
                    </div>
                  </div>

                  <div className="group bg-gradient-to-br from-purple-500/5 to-transparent rounded-xl p-5 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:scale-[1.02] cursor-default select-none">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg mt-1">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-white mb-1">Русский интерфейс</h3>
                        <p className="text-sm text-gray-400">Полностью переведенный интерфейс, удобная навигация и понятные категории для русскоязычных пользователей.</p>
                      </div>
                    </div>
                  </div>

                  <div className="group bg-gradient-to-br from-orange-500/5 to-transparent rounded-xl p-5 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 hover:scale-[1.02] cursor-default select-none">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-500/20 rounded-lg mt-1">
                        <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-white mb-1">Фильтрация контента</h3>
                        <p className="text-sm text-gray-400">Применяем фильтры для соблюдения законодательства РФ. Блокировка запрещённого контента происходит автоматически.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 bg-gradient-to-r from-modrinth-green/10 via-blue-500/10 to-purple-500/10 border border-modrinth-green/30 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-modrinth-green/20 rounded-full">
                      <svg className="w-6 h-6 text-modrinth-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white mb-2">Важная информация</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Наш сервис является <span className="font-semibold text-modrinth-green">информационным агрегатором</span> — мы собираем данные о модификациях и предоставляем удобный доступ к ним. 
                        Все файлы хранятся на серверах авторов модификаций, мы лишь предоставляем ссылки и описания. 
                        Это значит, что вы всегда получаете оригинальные, проверенные файлы напрямую от создателей контента.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="relative bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-purple-800/40 rounded-2xl p-8 md:p-10 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-500/30 to-indigo-500/30 rounded-xl border border-purple-400/40">
                  <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
                  Legal Information / Юридическая информация
                </h2>
              </div>
              <div className="rounded-xl p-6 md:p-8">
                <div className="space-y-4">
                  <p className="text-gray-200 leading-relaxed">
                    <span className="font-bold text-white">modrinth.black</span> is an independent project and has no relation to the original Modrinth and Rinth, Inc.
                  </p>
                  <p className="text-gray-200 leading-relaxed">
                    "Modrinth" is a trademark of Rinth, Inc. Modrinth App is a product of Rinth, Inc. All rights to Modrinth and Modrinth App belong to Rinth, Inc.
                  </p>
                  <p className="text-gray-200 leading-relaxed">
                    The domain name <span className="font-semibold text-purple-300">modrinth.black</span> and any use of the Modrinth trademark is for descriptive/nominative purposes only to identify the service this project interacts with, and does not imply endorsement, affiliation, or sponsorship by Rinth, Inc.
                  </p>
                  <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent mt-6"></div>
                  <div className="bg-purple-950/30 rounded-lg p-4 mt-4">
                    <p className="text-gray-300 leading-relaxed text-sm">
                      Эта информация служит для правообладателей и пользователей, чтобы четко обозначить независимость нашего проекта от официального Modrinth и Rinth, Inc. Мы уважаем права интеллектуальной собственности и используем товарные знаки исключительно в описательных целях для идентификации сервиса, с которым взаимодействует наш проект.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-2xl p-8 border border-blue-700/50 shadow-2xl">
            <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Как это работает?
            </h2>
            <div className="text-gray-300 space-y-4 leading-relaxed">
              <div className="flex flex-col md:flex-row items-center gap-4 my-8">
                <TiltCardDirectional className="flex-1 relative group" direction="top">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600/30 to-cyan-600/30 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  <div className="relative bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-2xl p-6 border border-blue-600/40 text-center">
                    <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-full bg-blue-500/20 border-2 border-blue-400 mx-auto">
                      <svg className="w-7 h-7 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-xl text-white mb-2">Запрос</h3>
                    <p className="text-sm text-gray-300">Вы ищете мод, плагин или шейдер на нашем сайте</p>
                  </div>
                </TiltCardDirectional>

                <div className="hidden md:block">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <div className="md:hidden">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>

                <TiltCardDirectional className="flex-1 relative group" direction="bottom">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600/30 to-teal-600/30 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  <div className="relative bg-gradient-to-br from-cyan-900/50 to-cyan-800/30 rounded-2xl p-6 border border-cyan-600/40 text-center">
                    <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-full bg-cyan-500/20 border-2 border-cyan-400 mx-auto">
                      <svg className="w-7 h-7 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-xl text-white mb-2">Поиск</h3>
                    <p className="text-sm text-gray-300">Система находит информацию в базах данных</p>
                  </div>
                </TiltCardDirectional>

                <div className="hidden md:block">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <div className="md:hidden">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>

                <TiltCardDirectional className="flex-1 relative group" direction="top">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-600/30 to-green-600/30 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  <div className="relative bg-gradient-to-br from-teal-900/50 to-teal-800/30 rounded-2xl p-6 border border-teal-600/40 text-center">
                    <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-full bg-green-500/20 border-2 border-modrinth-green-light mx-auto">
                      <svg className="w-7 h-7 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-xl text-white mb-2">Результат</h3>
                    <p className="text-sm text-gray-300">Прямая ссылка на официальный файл автора</p>
                  </div>
                </TiltCardDirectional>
              </div>
              <p>
                Технически, наш сервис является <span className="font-semibold text-blue-400">промежуточным звеном</span> между пользователем и источниками данных. 
                Мы предоставляем удобный интерфейс на русском языке и применяем фильтрацию контента.
              </p>
              <div className="bg-blue-950/30 border border-blue-700/30 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-200">
                  <strong>Важно:</strong> Все ссылки на скачивание ведут на серверы авторов модификаций. 
                  Наши серверы не взаимодействуют с файлами - мы только предоставляем информацию.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-2xl p-8 border border-purple-700/50 shadow-2xl">
            <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Соблюдение законодательства РФ
            </h2>
            <div className="text-gray-300 space-y-4 leading-relaxed">
              <p>
                Мы стремимся соблюдать действующее законодательство Российской Федерации и применяем меры по фильтрации контента:
              </p>
              <ul className="space-y-3 ml-4">
                <li className="flex items-start gap-3">
                  <span className="text-modrinth-green-light text-xl flex-shrink-0">✓</span>
                  <div>
                    <strong className="text-white">Блокировка проектов:</strong> Проекты, содержащие запрещенный контент, 
                    автоматически исключаются из поиска и недоступны для просмотра.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-modrinth-green-light text-xl flex-shrink-0">✓</span>
                  <div>
                    <strong className="text-white">Фильтрация изображений:</strong> Изображения с запрещенной символикой 
                    автоматически заменяются на нейтральные заглушки.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-modrinth-green-light text-xl flex-shrink-0">✓</span>
                  <div>
                    <strong className="text-white">Замена текста:</strong> Запрещенные термины автоматически заменяются 
                    на нейтральные символы в описаниях и названиях.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-modrinth-green-light text-xl flex-shrink-0">✓</span>
                  <div>
                    <strong className="text-white">Блокировка организаций:</strong> Проекты от определенных организаций 
                    могут быть ограничены в доступе.
                  </div>
                </li>
              </ul>

              <div className="mt-8 bg-gradient-to-br from-purple-950/50 to-indigo-950/50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-purple-300 mb-6 text-center">Статистика фильтрации контента</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <TiltCard className="bg-gradient-to-br from-red-900/40 to-red-800/20 rounded-xl p-6 border border-red-600/30 hover:border-red-500/60 transition-all duration-500 select-none cursor-default" shadowColor="rgba(239, 68, 68, 0.2)">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-red-400 mb-2 animate-pulse-slow">
                        {projectsCount}
                      </div>
                      <div className="text-lg font-semibold text-white mb-1">{pluralize(projectsCount, 'Проект', 'Проекта', 'Проектов')}</div>
                      <div className="text-sm text-gray-400">Заблокировано</div>
                      <div className="mt-3 pt-3 border-t border-red-800/50">
                        <p className="text-xs text-red-300/80 leading-relaxed">
                          Отдельные моды, плагины, шейдеры, ресурспаки, датапаки и модпаки, содержащие запрещённый контент. 
                          Эти материалы скрыты из поиска и каталога, доступ к их страницам ограничен.
                        </p>
                      </div>
                    </div>
                  </TiltCard>

                  <TiltCard className="bg-gradient-to-br from-orange-900/40 to-orange-800/20 rounded-xl p-6 border border-orange-600/30 hover:border-orange-500/60 transition-all duration-500 select-none cursor-default" shadowColor="rgba(249, 115, 22, 0.2)">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-orange-400 mb-2 animate-pulse-slow" style={{ animationDelay: '0.2s' }}>
                        {orgsCount}
                      </div>
                      <div className="text-lg font-semibold text-white mb-1">{pluralize(orgsCount, 'Организация', 'Организации', 'Организаций')}</div>
                      <div className="text-sm text-gray-400">Заблокировано</div>
                      <div className="mt-3 pt-3 border-t border-orange-800/50">
                        <p className="text-xs text-orange-300/80 leading-relaxed">
                          Разработчики и команды, все проекты которых полностью скрыты. 
                          Их моды, ресурспаки, шейдеры и другие материалы не отображаются на сайте и учитываются отдельно от индивидуально заблокированных проектов.
                        </p>
                      </div>
                    </div>
                  </TiltCard>

                  <TiltCard className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 rounded-xl p-6 border border-yellow-600/30 hover:border-yellow-500/60 transition-all duration-500 select-none cursor-default" shadowColor="rgba(234, 179, 8, 0.2)">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-yellow-400 mb-2 animate-pulse-slow" style={{ animationDelay: '0.4s' }}>
                        {mediaCount}
                      </div>
                      <div className="text-lg font-semibold text-white mb-1">{pluralize(mediaCount, 'Медиафайл', 'Медиафайла', 'Медиафайлов')}</div>
                      <div className="text-sm text-gray-400">Заблокировано</div>
                      <div className="mt-3 pt-3 border-t border-yellow-800/50">
                        <p className="text-xs text-yellow-300/80 leading-relaxed">
                          Изображения с запрещённой символикой: аватары авторов, иконки проектов, скриншоты в галереях и картинки в описаниях. 
                          Заблокированные медиафайлы заменяются на нейтральные заглушки.
                        </p>
                      </div>
                    </div>
                  </TiltCard>
                </div>
              </div>

              <div className="bg-purple-950/30 border border-purple-700/30 rounded-lg p-4 mt-4">
                <p className="text-sm text-purple-200">
                  Все фильтры работают автоматически на стороне нашего сервера. Мы регулярно обновляем списки 
                  блокировок в соответствии с требованиями законодательства.
                </p>
              </div>

              <div className="mt-6 bg-gradient-to-br from-purple-900/20 via-indigo-900/20 to-purple-900/20 rounded-2xl p-4 md:p-5">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="p-3 bg-purple-500/20 rounded-full border-2 border-purple-400/40">
                      <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-lg font-bold text-white mb-2">Связь с администрацией</h3>
                    <p className="text-gray-300 text-sm leading-relaxed mb-3">
                      Данный email предназначен <span className="font-semibold text-white">исключительно для официальных запросов</span> от государственных органов (РКН, прокуратура, суды и другие уполномоченные структуры) по вопросам блокировок и фильтрации контента.
                    </p>
                    <p className="text-gray-400 text-xs leading-relaxed mb-3 italic">
                      Пожалуйста, не используйте этот адрес для обращений авторов контента, коммерческих предложений, рекламных запросов или других неофициальных целей. Такие обращения не будут рассмотрены.
                    </p>
                    <div className="flex justify-center md:justify-start">
                      <EmailCopyButton email="black-minecraft@proton.me" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="p-8 md:p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Технический стек
              </h2>
            </div>

            <div className="relative flex flex-col items-center justify-center">
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 w-full relative z-0">
                <div className="w-full md:w-auto max-w-sm">
                  <div className="flex flex-col items-center text-center gap-4 p-6 transition-opacity duration-300 hover:opacity-80">
                    <div className="w-10 h-10 flex items-center justify-center mb-1">
                      <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white">Next.js 14</h3>
                    <p className="text-sm text-gray-400 leading-relaxed max-w-xs">React-фреймворк с серверным рендерингом. Построен на последних возможностях React, включая Server Components и Actions.</p>
                  </div>
                </div>

                <div className="w-full md:w-auto max-w-sm">
                  <div className="flex flex-col items-center text-center gap-4 p-6 transition-opacity duration-300 hover:opacity-80">
                    <div className="w-10 h-10 flex items-center justify-center mb-1">
                      <svg id="fi_15466168" enableBackground="new 0 0 24 24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" className="w-10 h-10">
                        <linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1=".625" x2="23.714" y1="5.724" y2="16.49">
                          <stop offset="0" stopColor="#fff" stopOpacity=".2"></stop>
                          <stop offset="1" stopColor="#fff" stopOpacity="0"></stop>
                        </linearGradient>
                        <g>
                          <path d="m22.1713867 7.3562379c.1484375-.9858675.0483398-3.5209553-.8637695-5.9873295l-.1367188-.3689084-.3911133.0462962c-.0961914.0112087-2.3491211.3011696-5.7329102 2.7461014-.736328-.1759258-1.8256835-.2753411-3.0468749-.2753411s-2.3100586.0994153-3.046875.2753412c-3.3847656-2.4454192-5.6376953-2.7348928-5.7338867-2.7461015l-.3911133-.0462962-.1367187.3689084c-.9121094 2.4663742-1.0117188 5.001462-.8632813 5.9873295-1.2294922 1.5175433-1.828125 3.2646193-1.828125 5.3333335 0 6.6476612 3.4921875 10.3084793 9.8334961 10.3084793l2.1669922.0019493 2.1655273-.0019493c6.3413086 0 9.8339844-3.6608181 9.8339844-10.3084793 0-2.0687142-.5986328-3.8162775-1.8286133-5.3333335z" fill="#333"></path>
                          <path d="m19.5366211 11.1315794c-1.293457-1.3084803-3.2001953-1.1608191-5.21875-1.0034113-.7363281.0575047-1.4975586.1169586-2.2822266.1169586h-.0708008c-.784668 0-1.5458984-.059454-2.2822266-.1169586-2.0185547-.1564331-3.9248047-.305069-5.2197266 1.0038986-.970703.9844046-1.4628905 2.2115002-1.4628905 3.6461983 0 5.7451267 4.4287109 6.2256336 9.0356445 6.2256336 4.5356446 0 8.9643555-.4805069 8.9643555-6.2256336 0-1.4346981-.4921875-2.6617937-1.4633789-3.6466856z" fill="#e0c1a9"></path>
                          <path d="m2.828125 1.2495127.3911133.0462962c.0961914.0112087 2.3491211.3006823 5.7338867 2.7461013.7368164-.1759258 1.8256836-.2753411 3.046875-.2753411s2.3105469.0994153 3.046875.275341c3.3837891-2.4449315 5.6367188-2.7348926 5.7329102-2.7461014l.3911133-.0462962.1367188.3689084c.6672974 1.8043981.8974609 3.6392546.9161987 4.8836503.0111084-1.2386699-.2017822-3.2013283-.9161987-5.133163l-.1367189-.3689082-.3911133.0462962c-.0961914.0112087-2.3491211.3011696-5.7329102 2.7461014-.736328-.1759258-1.8256835-.2753411-3.0468749-.2753411s-2.3100586.0994153-3.046875.2753412c-3.3847656-2.4454192-5.6376953-2.7348928-5.7338867-2.7461015l-.3911133-.0462962-.1367187.3689084c-.7142945 1.9314692-.927002 3.8938842-.9157715 5.1325536.0186157-1.2443958.2485962-3.0789473.9157715-4.8830409z" fill="#fff" opacity=".1"></path>
                          <path d="m22.1929321 7.3546753c.0236816-.2418823.0361328-.5344238.0308838-.8848267-.0031128.3434448-.0202637.6417236-.0524292.855835.0076904.0094604.013916.0194702.0215454.0289917z" fill="#82c342"></path>
                          <path d="m14.1660156 22.7485371-2.1655273.0019512-2.1669922-.0019512c-6.298584 0-9.7823486-3.6150703-9.8291016-10.1778746-.0004882.040144-.0043945.0785208-.0043945.1189089 0 6.6476612 3.4921875 10.3084793 9.8334961 10.3084793l2.1669922.0019493 2.1655273-.0019493c6.3413086 0 9.8339844-3.6608181 9.8339844-10.3084793 0-.0403881-.0039063-.0787649-.0043945-.1189089-.046753 6.5628653-3.5310059 10.1778746-9.8295899 10.1778746z" fill="#010101" opacity=".2"></path>
                          <path d="m1.7756348 6.4692383c-.005249.350647.0072632.6434326.0309448.885437.0076294-.0095215.013855-.0195313.0215454-.0289917-.0321655-.2142334-.0493774-.5127564-.0524902-.8564453z" fill="#82c342"></path>
                          <path d="m9.6826172 10.3530273c.7363281.0576172 1.4975586.1171875 2.2822266.1171875h.0708008c.784668 0 1.5458984-.0595703 2.2822266-.1171875 2.0185547-.1577148 3.925293-.3056641 5.21875 1.0053711.9501343.9654541 1.4345703 2.1661987 1.4553833 3.5637817.0008544-.0554809.0079955-.1034545.0079955-.1599731 0-1.4375-.4921875-2.6669922-1.4633789-3.6538086-1.293457-1.3110352-3.2001953-1.1630859-5.21875-1.0053711-.7363281.0576172-1.4975586.1171875-2.2822266.1171875h-.0708008c-.784668 0-1.5458984-.0595703-2.2822266-.1171875-2.0185547-.1567383-3.9248047-.3056641-5.2197266 1.0058594-.970703.9863281-1.4628905 2.2158203-1.4628905 3.6533203 0 .0565186.0071411.1044922.0079956.1599731.020813-1.397583.505249-2.5983276 1.454895-3.5632935 1.2949219-1.3115233 3.2011719-1.1625975 5.2197266-1.0058593z" fill="#010101" opacity=".1"></path>
                          <path d="m16 12c-1.1401367 0-2 1.5048828-2 3.5s.8598633 3.5 2 3.5 2-1.5048828 2-3.5-.8598633-3.5-2-3.5z" fill="#fff"></path>
                          <path d="m16 12.5c-.8551025 0-1.5 1.2898998-1.5 3s.6448975 3 1.5 3 1.5-1.2898998 1.5-3-.6448975-3-1.5-3z" fill="#994822"></path>
                          <circle cx="15.585" cy="14.085" fill="#fff" r=".415"></circle>
                          <circle cx="12.085" cy="18.085" fill="#994822" r=".415"></circle>
                          <g>
                            <path d="m12.0854492 19.5795898c-1.0776367 0-1.5073242-.6821289-1.6420898-.9750977l.4541016-.2089844c.0947266.2055664.3994141.684082 1.1879883.684082.5683594 0 .96875-.2314453 1.1894531-.6884766l.4501953.2177734c-.3027344.6259768-.8847657.9707033-1.6396485.9707033z" fill="#994822"></path>
                          </g>
                          <path d="m8 12c-1.1401367 0-2 1.5048828-2 3.5s.8598633 3.5 2 3.5 2-1.5048828 2-3.5-.8598633-3.5-2-3.5z" fill="#fff"></path>
                          <path d="m8 12.5c-.8551025 0-1.5 1.2898998-1.5 3s.6448975 3 1.5 3 1.5-1.2898998 1.5-3-.6448975-3-1.5-3z" fill="#994822"></path>
                          <circle cx="7.585" cy="14.085" fill="#fff" r=".415"></circle>
                          <path d="m22.1713867 7.3562379c.1484375-.9858675.0483398-3.5209553-.8637695-5.9873295l-.1367188-.3689084-.3911133.0462962c-.0961914.0112087-2.3491211.3011696-5.7329102 2.7461014-.736328-.1759258-1.8256835-.2753411-3.0468749-.2753411s-2.3100586.0994153-3.046875.2753412c-3.3847656-2.4454192-5.6376953-2.7348928-5.7338867-2.7461015l-.3911133-.0462962-.1367187.3689084c-.9121094 2.4663742-1.0117188 5.001462-.8632813 5.9873295-1.2294922 1.5175433-1.828125 3.2646193-1.828125 5.3333335 0 6.6476612 3.4921875 10.3084793 9.8334961 10.3084793l2.1669922.0019493 2.1655273-.0019493c6.3413086 0 9.8339844-3.6608181 9.8339844-10.3084793 0-2.0687142-.5986328-3.8162775-1.8286133-5.3333335z" fill="url(#SVGID_1_)"></path>
                        </g>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white">Open Source</h3>
                    <p className="text-sm text-gray-400 leading-relaxed max-w-xs">Исходный код полностью открыт и доступен на GitHub для изучения и участия в разработке.</p>
                  </div>
                </div>

                <div className="w-full md:w-auto max-w-sm">
                  <div className="flex flex-col items-center text-center gap-4 p-6 transition-opacity duration-300 hover:opacity-80">
                    <div className="w-10 h-10 flex items-center justify-center mb-1">
                      <InfrastructureIcon />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Облачная инфраструктура</h3>
                    <p className="text-sm text-gray-400 leading-relaxed max-w-xs">Развертывание на современной облачной платформе обеспечивает высокую производительность и надежность работы сервиса.</p>
                  </div>
                </div>
              </div>

              <ProtectionBlock />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
