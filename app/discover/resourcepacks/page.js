import Link from 'next/link'
import { buildCatalogSearchMetadata } from '@/lib/catalogSearchSeo'
import { searchMods, getMinecraftVersions } from '@/lib/modrinth'
import { filterModsList } from '@/lib/contentFilter'
import { loadCatalogPage } from '@/lib/loadCatalogPage'
import ResourcepackSidebarFilters from '@/app/resourcepacks/ResourcepackSidebarFilters'
import MobileMenu from '@/app/resourcepacks/MobileMenu'
import SortDropdown from '@/app/components/SortDropdown'
import ActiveFilters from '@/app/components/ActiveFilters'
import ResourceList from '@/app/components/ResourceList'
import ReloadButton from '@/app/components/ReloadButton'
import SearchInput from '@/app/components/SearchInput'
import CatalogSearchBlockedNote from '@/app/components/CatalogSearchBlockedNote'
import SearchLayoutCorrectionNote from '@/app/components/SearchLayoutCorrectionNote'
import CatalogEmptyResults from '@/app/components/CatalogEmptyResults'
import CatalogSearchAlternatives from '@/app/components/CatalogSearchAlternatives'
import { parseVersionParams, appendVersionParams, versionFacets } from '@/lib/catalogVersionParams'

export async function generateMetadata({ searchParams }) {
  return buildCatalogSearchMetadata('resourcepacks', searchParams, { basePath: 'discover/resourcepacks' })
}

export default async function ResourcepacksPage({ searchParams }) {
  const query = searchParams.q || '';
  const versions = parseVersionParams(searchParams);
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
  const gParams = Array.isArray(searchParams.g) ? searchParams.g : (searchParams.g ? [searchParams.g] : []);

  let categories = [];
  let excludedCategories = [];
  let features = [];
  let excludedFeatures = [];
  let resolutions = [];
  let excludedResolutions = [];

  const CATEGORY_IDS = ['combat', 'cursed', 'decoration', 'modded', 'realistic', 'simplistic', 'themed', 'tweaks', 'utility', 'vanilla-like'];
  const FEATURE_IDS = ['audio', 'blocks', 'core-shaders', 'entities', 'environment', 'equipment', 'fonts', 'gui', 'items', 'locale', 'models'];
  const RESOLUTION_IDS = ['8x-', '16x', '32x', '48x', '64x', '128x', '256x'];

  const processParam = (param) => {
    let decoded = decodeURIComponent(param.replace(/\+/g, '%2B'));
    
    if (decoded.includes('categories:') || decoded.includes('categories!=')) {
      const isExcluded = decoded.includes('categories!=');
      const value = decoded.replace('categories:', '').replace('categories!=', '');
      
      if (CATEGORY_IDS.includes(value)) {
        if (isExcluded) excludedCategories.push(value);
        else categories.push(value);
      } else if (FEATURE_IDS.includes(value)) {
        if (isExcluded) excludedFeatures.push(value);
        else features.push(value);
      } else if (RESOLUTION_IDS.includes(value)) {
        if (isExcluded) excludedResolutions.push(value);
        else resolutions.push(value);
      }
    }
  };

  fParams.forEach(processParam);
  gParams.forEach(processParam);

  const facets = [['project_type:resourcepack']];
  
  const versionsFacet = versionFacets(versions);
  if (versionsFacet) facets.push(versionsFacet);
  
  if (categories.length > 0) {
    categories.forEach(c => facets.push([`categories:${c}`]));
  }
  
  if (features.length > 0) {
    features.forEach(f => facets.push([`categories:${f}`]));
  }
  
  if (resolutions.length > 0) {
    resolutions.forEach(r => facets.push([`categories:${r}`]));
  }

  let searchAlternatives = []

  const {
    data,
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
    logLabel: 'resourcepacks',
  })
  const totalPages = data ? Math.ceil(data.total_hits / limit) : 0;

  const buildPageUrl = (newPage) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    appendVersionParams(params, versions);
    categories.forEach(c => params.append('f', `categories:${c}`));
    excludedCategories.forEach(c => params.append('f', `categories!=${c}`));
    features.forEach(f => params.append('f', `categories:${f}`));
    excludedFeatures.forEach(f => params.append('f', `categories!=${f}`));
    resolutions.forEach(r => params.append('f', `categories:${r}`));
    excludedResolutions.forEach(r => params.append('f', `categories!=${r}`));
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    params.set('page', newPage.toString());
    return `/discover/resourcepacks?${params.toString()}`;
  };

  return (
    <>
      <MobileMenu initialVersions={mcVersions} />
      <div className="flex gap-6">
        <ResourcepackSidebarFilters initialVersions={mcVersions} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Minecraft ресурспаки</h1>
                <p className="text-gray-400 text-sm md:text-base">
                  {data ? (
                    <>
                      {data.total_hits.toLocaleString('ru-RU')} ресурспаков найдено
                      <CatalogSearchBlockedNote count={blockedCount} />
                    </>
                  ) : (
                    'Загрузка...'
                  )}
                </p>
              </div>
              <SearchInput 
                defaultValue={query}
                placeholder="Поиск ресурспаков..."
                categoryPath="discover/resourcepacks"
              />
            </div>

            <SearchLayoutCorrectionNote correction={layoutCorrection} />
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <SortDropdown 
                  currentSort={sortBy} 
                  query={query} 
                  version={versions} 
                  categoryPath="discover/resourcepacks"
                  searchParams={searchParams}
                />
              </div>
              <ActiveFilters categoryPath="discover/resourcepacks" />
            </div>
          </div>

      {error ? (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <svg className="w-16 h-16 mx-auto text-orange-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold text-white mb-2">Не удалось загрузить ресурспаки</h2>
            <p className="text-gray-400 mb-6">Попробуйте обновить страницу через несколько секунд</p>
            <ReloadButton />
          </div>
        </div>
      ) : data && data.hits.length === 0 ? (
        <>
          <CatalogSearchAlternatives
            query={query}
            categoryPath="discover/resourcepacks"
            version={versions}
            catalogKey="resourcepacks"
            alternatives={searchAlternatives}
          />
          <div className={searchAlternatives.length > 0 ? 'pb-8' : 'text-center py-16'}>
            <CatalogEmptyResults
              data={data}
              blockedCount={blockedCount}
              blockedByProject={blockedByProject}
              blockedByOrganization={blockedByOrganization}
              foundLabel="найденных ресурспаков"
              blockedTitle="Все ресурспаки на этой странице заблокированы"
              emptyTitle="Ресурспаки не найдены"
              hideEmptyMessage={searchAlternatives.length > 0}
            />
          </div>
        </>
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

          <ResourceList resources={data.hits} type="resourcepack" />

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
