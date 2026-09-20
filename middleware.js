import { NextResponse } from 'next/server'
import { isPhantomCrawlerPath } from './lib/relativeContentUrls'

export function middleware(request) {
  const { pathname, search } = request.nextUrl

  if (isPhantomCrawlerPath(pathname)) {
    return new NextResponse(null, {
      status: 410,
      headers: { 'Cache-Control': 'public, max-age=86400' },
    })
  }
  
  const redirects = {
    '/mods': '/discover/mods',
    '/resourcepacks': '/discover/resourcepacks',
    '/datapacks': '/discover/datapacks',
    '/shaders': '/discover/shaders',
    '/modpacks': '/discover/modpacks',
    '/plugins': '/discover/plugins',
    '/servers': '/discover/servers',
  }
  
  for (const [oldPath, newPath] of Object.entries(redirects)) {
    if (pathname === oldPath || pathname.startsWith(oldPath + '/')) {
      const newPathname = pathname.replace(oldPath, newPath)
      const newUrl = new URL(newPathname + search, request.url)
      if (newPath === '/discover/servers' && !newUrl.searchParams.has('sst')) {
        newUrl.searchParams.set('sst', 'online')
      }
      return NextResponse.redirect(newUrl, 308)
    }
  }

  if (pathname === '/discover/servers' && !request.nextUrl.searchParams.has('sst')) {
    const newUrl = new URL(request.url)
    newUrl.searchParams.set('sst', 'online')
    return NextResponse.redirect(newUrl, 307)
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-modrinth-pathname', pathname + search)
  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: [
    '/banner.webp',
    '/ads/:path*',
    '/mods/:path*',
    '/resourcepacks/:path*',
    '/datapacks/:path*',
    '/shaders/:path*',
    '/modpacks/:path*',
    '/plugins/:path*',
    '/servers/:path*',
    '/discover/servers',
    '/mod/:path*',
    '/plugin/:path*',
    '/modpack/:path*',
    '/resourcepack/:path*',
    '/shader/:path*',
    '/datapack/:path*',
    '/server/:path*',
  ],
}
