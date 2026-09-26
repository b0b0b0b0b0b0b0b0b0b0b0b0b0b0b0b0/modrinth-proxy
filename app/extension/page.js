import { getRequestT } from '@/lib/i18n/server'

const STORE =
  'https://chromewebstore.google.com/detail/modrinth-redirect/poamgpbaabemlgienajmcolicdiapekg'

export async function generateMetadata() {
  const { t } = getRequestT()
  return {
    title: t('ext.metaTitle'),
    description: t('ext.metaDesc'),
  }
}

export default function ExtensionPage() {
  const { t } = getRequestT()
  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-modrinth-green to-modrinth-green-light rounded-2xl flex items-center justify-center shadow-2xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-modrinth-green via-blue-400 to-purple-400 bg-clip-text text-transparent">
            {t('ext.h1')}
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            {t('ext.lead')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-modrinth-green/10 to-transparent rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-modrinth-green/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-modrinth-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white">{t('ext.what')}</h2>
              </div>

              <p className="text-lg text-gray-300 leading-relaxed mb-6">
                {t('ext.whatLead')}{' '}
                <span className="text-modrinth-green font-semibold">modrinth.com</span> {t('ext.to')}{' '}
                <span className="text-modrinth-green font-semibold">modrinth.black</span>
              </p>

              <div className="space-y-4">
                {[t('ext.instant'), t('ext.allPages'), t('ext.keepUrl'), t('ext.light')].map((line) => (
                  <div key={line} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-modrinth-green rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-300">{line}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <svg className="w-8 h-8 text-modrinth-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('ext.install')}
              </h2>

              <div className="rounded-2xl p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white">{t('ext.store')}</h3>
                  <p className="text-gray-300">{t('ext.official')}</p>
                </div>

                <p className="text-lg text-gray-300 mb-6">{t('ext.browsers')}</p>

                <a
                  href={STORE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-gradient-to-r from-modrinth-green to-modrinth-green-light text-black font-bold py-4 px-8 rounded-2xl hover:from-modrinth-green-light hover:to-modrinth-green transition-all duration-300 transform hover:scale-95 shadow-xl text-center"
                >
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t('ext.installStore')}
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-modrinth-green/10 rounded-3xl p-4 md:p-8 shadow-2xl border border-modrinth-green/20 mb-16">
          <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">{t('ext.help')}</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              ['b1', 'b1d'],
              ['b2', 'b2d'],
              ['b3', 'b3d'],
              ['b4', 'b4d'],
            ].map(([title, desc]) => (
              <div key={title} className="p-4 md:p-6 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-colors text-center flex flex-col items-center">
                <div className="w-8 h-8 bg-modrinth-green rounded-full flex items-center justify-center mb-3 md:mb-4">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-200 font-medium mb-2">{t(`ext.${title}`)}</p>
                <p className="text-gray-400 text-sm">{t(`ext.${desc}`)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-modrinth-green/5 to-transparent rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-4">{t('ext.how')}</h2>
            <p className="text-xl text-gray-400">{t('ext.howLead')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              ['s1', 's1d'],
              ['s2', 's2d'],
              ['s3', 's3d'],
            ].map(([title, desc]) => (
              <div key={title} className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-modrinth-green to-modrinth-green-light rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{t(`ext.${title}`)}</h3>
                <p className="text-gray-400">{t(`ext.${desc}`)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-modrinth-green/10 to-transparent rounded-3xl p-8 md:p-12 shadow-2xl">
            <h2 className="text-4xl font-bold text-white mb-6">{t('ext.cta')}</h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">{t('ext.ctaLead')}</p>

            <div className="flex justify-center">
              <a
                href={STORE}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-modrinth-green to-modrinth-green-light text-black font-bold py-4 px-8 rounded-2xl hover:from-modrinth-green-light hover:to-modrinth-green transition-all duration-300 transform hover:scale-95 shadow-xl"
              >
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {t('ext.installExt')}
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
