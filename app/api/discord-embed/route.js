import { DISCORD_EMBED_I18N, siteDiscordEmbed } from '@/lib/discordEmbed'

export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json(siteDiscordEmbed(DISCORD_EMBED_I18N), {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
