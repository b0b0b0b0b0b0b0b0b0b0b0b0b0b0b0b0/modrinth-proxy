import { redirect } from 'next/navigation'
import { buildCatalogSearchMetadata } from '@/lib/catalogSearchSeo'
import { searchMods, getMinecraftVersions } from '@/lib/modrinth'
import { filterModsList } from '@/lib/contentFilter'
import { loadCatalogPage } from '@/lib/loadCatalogPage'
import DatapackSidebarFilters from '@/app/datapacks/DatapackSidebarFilters'
import MobileMenu from '@/app/datapacks/MobileMenu'
import SortDropdown from '@/app/components/SortDropdown'
import ActiveFilters from '@/app/components/ActiveFilters'
import CatalogPagination from '@/app/components/CatalogPagination'
import ResourceList from '@/app/components/ResourceList'
import ReloadButton from '@/app/components/ReloadButton'
import SearchInput from '@/app/components/SearchInput'
import CatalogSearchBlockedNote from '@/app/components/CatalogSearchBlockedNote'
import SearchLayoutCorrectionNote from '@/app/components/SearchLayoutCorrectionNote'
import CatalogEmptyResults from '@/app/components/CatalogEmptyResults'
import CatalogSearchAlternatives from '@/app/components/CatalogSearchAlternatives'
import { findCatalogSearchAlternatives } from '@/lib/catalogCrossSearch'
import { parseVersionParams, appendVersionParams, versionFacets } from '@/lib/catalogVersionParams'

export async function generateMetadata({ searchParams }) {
  return buildCatalogSearchMetadata('datapacks', searchParams, { basePath: 'discover/datapacks' })
}

export default async function DatapacksPage({ searchParams }) {
  const query = searchParams.q || '';
  const versions = parseVersionParams(searchParams);
  const sortBy = searchParams.sort || 'relevance';
  const lParam = searchParams.l
  const openSourceState = lParam === 'open_source:true' ? 'selected' : lParam === 'open_source:false' ? 'excluded' : 'none';
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

  const facets = [['project_type:datapack']];
  
  const versionsFacet = versionFacets(versions);
  if (versionsFacet) facets.push(versionsFacet);
  
  if (categories.length > 0) {
    categories.forEach(c => facets.push([`categories:${c}`]));
  }
  
  if (openSourceState === 'selected') {
    facets.push(['open_source:true']);
  }

  const buildPageUrl = (newPage) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    appendVersionParams(params, versions);
    categories.forEach(c => params.append('f', `categories:${c}`));
    excludedCategories.forEach(c => params.append('f', `categories!=${c}`));
    if (openSourceState === 'selected') params.set('l', 'open_source:true');
    else if (openSourceState === 'excluded') params.set('l', 'open_source:false');
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    params.set('page', newPage.toString());
    return `/discover/datapacks?${params.toString()}`;
  };

  let searchAlternatives = []

  const {
    data,
    effectivePage,
    totalPages,
    layoutCorrection,
    blockedCount,
    blockedByProject,
    blockedByOrganization,
    error,
  } = await loadCatalogPage({
    searchBatch: (opts) => searchMods({ query, facets, index: sortBy, ...opts }),
    page,
    limit,
    filterList: filterModsList,
    logLabel: 'datapacks',
  })

  if (!error && effectivePage !== page) {
    redirect(buildPageUrl(effectivePage))
  }

  if (!error && query.trim() && data?.hits?.length === 0 && blockedCount === 0) {
    try {
      searchAlternatives = await findCatalogSearchAlternatives('datapacks', query, { version: versions })
    } catch (err) {
      console.error('Failed to load search alternatives:', err)
    }
  }

  return (
    <>
      <MobileMenu initialVersions={mcVersions} />
      <div className="flex gap-6">
        <DatapackSidebarFilters initialVersions={mcVersions} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Minecraft датапаки</h1>
                <p className="text-gray-400 text-sm md:text-base">
                  {data ? (
                    <>
                      {data.total_hits.toLocaleString('ru-RU')} датапаков найдено
                      <CatalogSearchBlockedNote count={blockedCount} />
                    </>
                  ) : (
                    'Загрузка...'
                  )}
                </p>
              </div>
              <SearchInput 
                defaultValue={query}
                placeholder="Поиск датапаков..."
                categoryPath="discover/datapacks"
              />
            </div>

            <SearchLayoutCorrectionNote correction={layoutCorrection} />
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <SortDropdown 
                  currentSort={sortBy} 
                  query={query} 
                  version={versions} 
                  categoryPath="discover/datapacks"
                  searchParams={searchParams}
                />
              </div>
              <ActiveFilters categoryPath="discover/datapacks" />
            </div>
          </div>

      {error ? (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <svg className="w-16 h-16 mx-auto text-orange-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold text-white mb-2">Не удалось загрузить датапаки</h2>
            <p className="text-gray-400 mb-6">Попробуйте обновить страницу через несколько секунд</p>
            <ReloadButton />
          </div>
        </div>
      ) : data && data.hits.length === 0 ? (
        <>
          <CatalogSearchAlternatives
            query={query}
            categoryPath="discover/datapacks"
            version={versions}
            catalogKey="datapacks"
            alternatives={searchAlternatives}
          />
          <div className={searchAlternatives.length > 0 ? 'pb-8' : 'text-center py-16'}>
            <CatalogEmptyResults
              data={data}
              blockedCount={blockedCount}
              blockedByProject={blockedByProject}
              blockedByOrganization={blockedByOrganization}
              foundLabel="найденных датапаков"
              blockedTitle="Все датапаки на этой странице заблокированы"
              emptyTitle="Датапаки не найдены"
              hideEmptyMessage={searchAlternatives.length > 0}
            />
          </div>
        </>
      ) : (
        <>
          <CatalogPagination
            page={page}
            totalPages={totalPages}
            pathname="/discover/datapacks"
            searchParams={searchParams}
            className="mb-6"
          />

          <ResourceList resources={data.hits} type="datapack" />

          <CatalogPagination
            page={page}
            totalPages={totalPages}
            pathname="/discover/datapacks"
            searchParams={searchParams}
            className="mt-8"
          />
        </>
      )}
        </div>
      </div>
    </>
  )
}
