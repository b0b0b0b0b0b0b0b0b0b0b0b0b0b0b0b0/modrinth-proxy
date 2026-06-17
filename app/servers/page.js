import Link from 'next/link'
import { searchMods, getMinecraftVersions } from '@/lib/modrinth'
import { filterModsList } from '@/lib/contentFilter'
import { fetchFilteredCatalogPage } from '@/lib/catalogPagination'
import ServerSidebarFilters from './ServerSidebarFilters'
import MobileMenu from './MobileMenu'
import SortDropdown from '@/app/components/SortDropdown'
import ActiveFilters from '@/app/components/ActiveFilters'
import ReloadButton from '@/app/components/ReloadButton'
import SearchInput from '@/app/components/SearchInput'
import CatalogSearchBlockedNote from '@/app/components/CatalogSearchBlockedNote'
import SearchLayoutCorrectionNote from '@/app/components/SearchLayoutCorrectionNote'
import ResourceList from '@/app/components/ResourceList'
import { buildServerCatalogSeo } from '@/lib/serverCatalogSeo'

export async function generateMetadata({ searchParams }) {
  const { title, description } = buildServerCatalogSeo({ searchParams })

  return {
    title,
    description,
    robots: 'all',
    openGraph: {
      siteName: 'modrinth.black',
      type: 'website',
      title,
      description,
    },
  }
}

export default async function ServersPage({ searchParams }) {
  const query = searchParams.q || '';
  let version = searchParams.v || '';
  const sortBy = searchParams.sort || 'relevance';
  const page = parseInt(searchParams.page || '1');
  const limit = 20;
  
  let mcVersions = { release: [], full: [] };
  try {
    const apiVersions = await getMinecraftVersions();
    const releaseVersions = apiVersions.filter(v => v.version_type === 'release').map(v => v.version);
    const allVersions = apiVersions.map(v => v.version);
    mcVersions = {
      release: releaseVersions,
      full: allVersions
    };
  } catch (error) {
    console.error('Failed to load Minecraft versions:', error);
  }
  
  const fParams = Array.isArray(searchParams.f) ? searchParams.f : (searchParams.f ? [searchParams.f] : []);
  let categories = [];
  let excludedCategories = [];
  
  fParams.forEach(param => {
    const decoded = decodeURIComponent(param);
    if (decoded.includes('categories:')) {
      const value = decoded.replace('categories:', '');
      categories.push(value);
    } else if (decoded.includes('categories!=')) {
      const value = decoded.replace('categories!=', '');
      excludedCategories.push(value);
    }
  });

  const facets = [['project_type:minecraft_java_server']];
  
  if (version) {
    facets.push([`versions:${version}`]);
  }
  
  if (categories.length > 0) {
    facets.push(categories.map(c => `categories:${c}`));
  }

  let data = null;
  let blockedCount = 0, blockedByProject = 0, blockedByOrganization = 0;
  let layoutCorrection = null;
  let error = null;
  
  try {
    const initialData = await searchMods({ query, facets, limit: 1, offset: 0, index: sortBy });
    layoutCorrection = initialData.layoutCorrection ?? null;
    const totalHits = initialData.total_hits;
    
    let totalBlockedCount = 0, totalBlockedByProject = 0, totalBlockedByOrganization = 0;
    let currentOffset = 0;
    const batchSize = 100;
    const maxBatches = Math.ceil(totalHits / batchSize);
    
    for (let i = 0; i < Math.min(maxBatches, 10); i++) {
      const batchData = await searchMods({ query, facets, limit: batchSize, offset: currentOffset, index: sortBy });
      const filtered = filterModsList(batchData.hits);
      totalBlockedCount += filtered.blockedCount;
      totalBlockedByProject += filtered.blockedByProject;
      totalBlockedByOrganization += filtered.blockedByOrganization;
      
      if (currentOffset + batchData.hits.length >= totalHits) {
        break;
      }
      
      currentOffset += batchSize;
    }
    
    blockedCount = totalBlockedCount;
    blockedByProject = totalBlockedByProject;
    blockedByOrganization = totalBlockedByOrganization;
    
    data = await fetchFilteredCatalogPage({
      searchBatch: (opts) => searchMods({ query, facets, index: sortBy, ...opts }),
      page,
      limit,
      filterList: filterModsList,
    })
  } catch (err) {
    console.error('Failed to load servers:', err);
    error = err;
  }

  const totalPages = data ? Math.ceil(data.total_hits / limit) : 0;

  const buildPageUrl = (newPage) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (version) params.set('v', version);
    categories.forEach(c => params.append('f', `categories:${c}`));
    excludedCategories.forEach(c => params.append('f', `categories!=${c}`));
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    params.set('page', newPage.toString());
    return `/servers?${params.toString()}`;
  };

  return (
    <>
      <MobileMenu initialVersions={mcVersions} />
      <div className="flex gap-6">
        <ServerSidebarFilters initialVersions={mcVersions} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Minecraft серверы</h1>
                <p className="text-gray-400 text-sm md:text-base">
                  {data ? (
                    <>
                      {data.total_hits.toLocaleString('ru-RU')} серверов найдено
                      <CatalogSearchBlockedNote count={blockedCount} />
                    </>
                  ) : (
                    'Загрузка...'
                  )}
                </p>
              </div>
              <SearchInput 
                defaultValue={query}
                placeholder="Поиск серверов..."
                categoryPath="servers"
              />
            </div>

            <SearchLayoutCorrectionNote correction={layoutCorrection} />
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <SortDropdown 
                  currentSort={sortBy} 
                  query={query} 
                  version={version} 
                  categoryPath="servers"
                  searchParams={searchParams}
                />
              </div>
              <ActiveFilters categoryPath="servers" />
            </div>
          </div>

          {error ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <svg className="w-16 h-16 mx-auto text-orange-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-xl font-bold text-white mb-2">Не удалось загрузить серверы</h2>
                <p className="text-gray-400 mb-6">Попробуйте обновить страницу через несколько секунд</p>
                <ReloadButton />
              </div>
            </div>
          ) : data && data.hits.length === 0 ? (
            <div className="text-center py-16">
              {blockedCount > 0 ? (
                <div className="max-w-2xl mx-auto">
                  <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-xl font-semibold text-red-400 mb-3">Все серверы на этой странице заблокированы</p>
                  <p className="text-gray-400 text-sm">
                    Из {data.total_hits.toLocaleString('ru-RU')} найденных серверов, все {blockedCount} на текущей странице заблокированы по требованиям РКН
                    {blockedByProject > 0 && blockedByOrganization > 0 && (
                      <> ({blockedByProject} по проекту, {blockedByOrganization} по организации)</>
                    )}
                    {blockedByProject > 0 && blockedByOrganization === 0 && (
                      <> ({blockedByProject} по проекту)</>
                    )}
                    {blockedByProject === 0 && blockedByOrganization > 0 && (
                      <> ({blockedByOrganization} по организации)</>
                    )}
                    . Попробуйте изменить параметры поиска или фильтры.
                  </p>
                </div>
              ) : (
                <p className="text-xl text-gray-400">Серверы не найдены</p>
              )}
            </div>
          ) : (
            <>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mb-6">
                  {page > 1 && (
                    <Link
                      href={buildPageUrl(page - 1)}
                      className="px-4 py-2 bg-modrinth-dark border border-gray-700 rounded-lg hover:border-modrinth-green transition"
                    >
                      ← Назад
                    </Link>
                  )}
                  
                  <span className="px-4 py-2 bg-modrinth-dark border border-modrinth-green rounded-lg">
                    {page} / {totalPages}
                  </span>

                  {page < totalPages && (
                    <Link
                      href={buildPageUrl(page + 1)}
                      className="px-4 py-2 bg-modrinth-dark border border-gray-700 rounded-lg hover:border-modrinth-green transition"
                    >
                      Вперёд →
                    </Link>
                  )}
                </div>
              )}

              <ResourceList resources={data.hits} type="server" />

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {page > 1 && (
                    <Link
                      href={buildPageUrl(page - 1)}
                      className="px-4 py-2 bg-modrinth-dark border border-gray-700 rounded-lg hover:border-modrinth-green transition"
                    >
                      ← Назад
                    </Link>
                  )}
                  
                  <span className="px-4 py-2 bg-modrinth-dark border border-modrinth-green rounded-lg">
                    {page} / {totalPages}
                  </span>

                  {page < totalPages && (
                    <Link
                      href={buildPageUrl(page + 1)}
                      className="px-4 py-2 bg-modrinth-dark border border-gray-700 rounded-lg hover:border-modrinth-green transition"
                    >
                      Вперёд →
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
