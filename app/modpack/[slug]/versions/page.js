import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getMod, getModVersions, getTeamMembers, getOrganization } from '@/lib/modrinth'
import { filterModContent, filterTeamMembers, isProjectBlocked, isOrganizationBlocked } from '@/lib/contentFilter'
import ResourceSidebar from '@/app/components/ResourceSidebar'
import ContentNavigation from '@/app/components/ContentNavigation'
import ResourceHeader from '@/app/components/ResourceHeader'
import VersionsList from '@/app/components/VersionsList'
import IconPreload from '@/app/components/IconPreload'

export async function generateMetadata({ params }) {
  try {
    const modpack = await getMod(params.slug)
    const url = `https://modrinth.black/modpack/${params.slug}/versions`
    return {
      title: `${modpack.title} - Версии | ModrinthProxy`,
      description: `Все версии модпака ${modpack.title}.`,
      openGraph: {
        siteName: 'modrinth.black',
        type: 'website',
        url: url,
        title: `${modpack.title} - Версии | ModrinthProxy`,
        description: `Все версии модпака ${modpack.title}.`,
        images: modpack.icon_url ? [{ url: modpack.icon_url }] : [],
      },
      twitter: {
        card: 'summary',
        title: `${modpack.title} - Версии | ModrinthProxy`,
        description: `Все версии модпака ${modpack.title}.`,
        images: modpack.icon_url ? [modpack.icon_url] : [],
      },
    }
  } catch {
    return { title: 'Модпак не найден | ModrinthProxy' }
  }
}

export default async function ModpackVersionsPage({ params, searchParams }) {
  const { slug } = params;
  if (isProjectBlocked(slug)) {
    return <div className="text-center py-16"><Link href="/modpacks" className="inline-flex items-center gap-2 bg-modrinth-green text-black px-6 py-3 rounded-lg font-semibold">Вернуться</Link></div>
  }

  const initialLoader = searchParams.l || 'all'

  let modpack, versions, teamMembers, organization;
  try {
    [modpack, versions, teamMembers] = await Promise.all([getMod(slug), getModVersions(slug), getTeamMembers(slug)]);
    modpack = filterModContent(modpack);
    teamMembers = filterTeamMembers(teamMembers);
    organization = modpack.organization ? await getOrganization(modpack.organization) : null;
    if ((isProjectBlocked(modpack.slug, modpack.id) || isOrganizationBlocked(modpack.organization))) notFound()
  } catch (error) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto">
      <IconPreload iconUrl={modpack.icon_url} />
      <ResourceHeader resource={modpack} contentType="modpack" versions={versions} />
      
      <ContentNavigation slug={slug} contentType="modpack" versionsCount={versions.length} galleryCount={modpack.gallery?.length || 0} projectColor={modpack.color} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2">
          <VersionsList versions={versions} contentType="modpack" slug={slug} initialLoader={initialLoader} projectColor={modpack.color} />
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <ResourceSidebar resource={modpack} organization={organization} teamMembers={teamMembers} />
        </div>
      </div>
    </div>
  )
}

