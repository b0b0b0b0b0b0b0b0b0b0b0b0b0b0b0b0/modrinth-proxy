import { DISCORD_EMBED_TYPES, DISCORD_EMBED_I18N, projectDiscordEmbed, siteDiscordEmbed } from '@/lib/discordEmbed'

export const dynamic = 'force-dynamic'

const SLUG_RE = /^[\w.-]{1,96}$/
const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=86400',
}

export async function GET(request, { params }) {
  const slug = decodeURIComponent(params.slug || '')
  let embed = null
  if (DISCORD_EMBED_TYPES.includes(params.type) && SLUG_RE.test(slug)) {
    try {
      embed = await projectDiscordEmbed(params.type, slug, DISCORD_EMBED_I18N)
    } catch {}
  }
  return Response.json(embed || siteDiscordEmbed(DISCORD_EMBED_I18N), { headers: HEADERS })
}
