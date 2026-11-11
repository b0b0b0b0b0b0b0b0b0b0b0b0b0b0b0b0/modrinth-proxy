import Link from 'next/link'
import {
  HOME_MOD_LOADER_MAIN,
  HOME_SERVER_CORE_MAIN,
  MOD_LOADERS,
  PLUGIN_LOADERS,
  PLUGIN_PLATFORMS,
} from '@/lib/loaders'

const KINDS = {
  mods: { path: '/mods', all: MOD_LOADERS, main: HOME_MOD_LOADER_MAIN },
  plugins: { path: '/plugins', all: [...PLUGIN_LOADERS, ...PLUGIN_PLATFORMS], main: HOME_SERVER_CORE_MAIN },
}

const pick = ({ all, main }) => ({
  main: main.map((id) => all.find((loader) => loader.id === id)).filter(Boolean),
  rest: all.filter((loader) => !main.includes(loader.id)),
})

const GROUPS = Object.fromEntries(Object.entries(KINDS).map(([kind, config]) => [kind, pick(config)]))

export default function HomeLoaders({ kind = 'mods', alsoLabel }) {
  const { path } = KINDS[kind]
  const { main, rest } = GROUPS[kind]
  const href = (id) => `${path}?g=categories%3A${encodeURIComponent(id)}`

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8">
        {main.map((loader) => (
          <Link
            key={loader.id}
            href={href(loader.id)}
            className="relative text-center p-4 pt-12 bg-(--bg-tertiary) rounded-xl transition-[filter] hover:brightness-110"
          >
            <div
              className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-modrinth-darkest rounded-lg flex items-center justify-center z-10"
              style={{ boxShadow: '2px 2px 12px rgba(0,0,0,0.16), inset 2px 2px 32px var(--shadow-color)' }}
            >
              <span className="flex h-6 w-6 [&>svg]:h-full [&>svg]:w-full" style={{ color: loader.color }} aria-hidden>
                {loader.icon}
              </span>
            </div>
            <div className="text-white font-medium text-sm">{loader.name}</div>
          </Link>
        ))}
      </div>
      {rest.length > 0 ? (
        <div className="mt-8 border-t border-(--border-color) pt-5 text-center">
          <span className="text-sm text-gray-400">{alsoLabel}</span>
          <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2">
            {rest.map((loader) => (
              <Link
                key={loader.id}
                href={href(loader.id)}
                className="inline-flex items-center gap-1.5 text-sm text-gray-300 transition-colors hover:text-modrinth-green"
              >
                <span className="flex h-4 w-4 [&>svg]:h-full [&>svg]:w-full" style={{ color: loader.color }} aria-hidden>
                  {loader.icon}
                </span>
                {loader.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </>
  )
}
