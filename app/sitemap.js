import { searchMods } from '@/lib/modrinth'

export default async function sitemap() {
  const baseUrl = 'https://modrinth.black'
  
  const routes = [
    '',
    '/mods',
    '/plugins',
    '/shaders',
    '/resourcepacks',
    '/datapacks',
    '/modpacks',
    '/servers',
    '/discover/servers',
    '/news',
    '/extension',
    '/bmadnco',
    '/protect-bot',
    '/file-lookup',
  ]

  const staticPages = routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }))

  const resourceTypes = [
    { facet: 'mod', route: 'mod' },
    { facet: 'plugin', route: 'plugin' },
    { facet: 'shader', route: 'shader' },
    { facet: 'resourcepack', route: 'resourcepack' },
    { facet: 'datapack', route: 'datapack' },
    { facet: 'modpack', route: 'modpack' },
    { facet: 'minecraft_java_server', route: 'server' },
  ]

  const dynamicPages = []

  const fetchPromises = resourceTypes.map(async (type) => {
    try {
      const data = await Promise.race([
        searchMods({
          facets: [['project_type:' + type.facet]],
          limit: 50,
          index: 'downloads',
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 8000)
        )
      ])

      return data.hits.map((project) => ({
        url: `${baseUrl}/${type.route}/${project.slug}`,
        lastModified: new Date(project.date_modified || project.date_created),
        changeFrequency: 'weekly',
        priority: 0.6,
      }))
    } catch (error) {
      console.error(`Error fetching ${type.facet}:`, error)
      return []
    }
  })

  const results = await Promise.all(fetchPromises)
  dynamicPages.push(...results.flat())

  return [...staticPages, ...dynamicPages]
}
