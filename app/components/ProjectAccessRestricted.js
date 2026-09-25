import Link from 'next/link'

export default function ProjectAccessRestricted({ href, label }) {
  return (
    <div className="text-center py-16 max-w-2xl mx-auto">
      <div className="mb-6">
        <svg className="w-20 h-20 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h1 className="text-3xl font-bold text-red-500 mb-4">Доступ ограничен</h1>
        <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-6 mb-6 text-left">
          <p className="text-gray-300 mb-3">
            Данный проект недоступен в соответствии с региональными ограничениями и требованиями Роскомнадзора.
          </p>
          <p className="text-gray-400 text-sm">
            К сожалению, некоторые проекты были заблокированы на территории Российской Федерации по решению регулирующих органов. Мы вынуждены ограничить доступ к этому контенту для соблюдения действующего законодательства.
          </p>
        </div>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-2 bg-modrinth-green text-black px-6 py-3 rounded-lg font-semibold hover:bg-modrinth-green-light transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>{label}</span>
      </Link>
    </div>
  )
}
