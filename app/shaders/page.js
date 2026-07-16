import Link from 'next/link'
import { buildCatalogSearchMetadata } from '@/lib/catalogSearchSeo'
import { searchMods, getMinecraftVersions } from '@/lib/modrinth'
import { filterModsList } from '@/lib/contentFilter'
import { fetchFilteredCatalogPage } from '@/lib/catalogPagination'
import ShaderSidebarFilters from './ShaderSidebarFilters'
import MobileMenu from './MobileMenu'
import SortDropdown from '@/app/components/SortDropdown'
import ActiveFilters from '@/app/components/ActiveFilters'
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
  return buildCatalogSearchMetadata('shaders', searchParams, { basePath: 'shaders' })
}

export default async function ShadersPage({ searchParams }) {
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
  
  let styles = [];
  let excludedStyles = [];
  let features = [];
  let excludedFeatures = [];
  let performance = [];
  let excludedPerformance = [];
  let loaders = [];
  let excludedLoaders = [];

  const STYLE_IDS = ['cartoon', 'cursed', 'fantasy', 'realistic', 'semi-realistic', 'vanilla-like'];
  const FEATURE_IDS = ['atmosphere', 'bloom', 'colored-lighting', 'foliage', 'path-tracing', 'pbr', 'reflections', 'shadows'];
  const PERFORMANCE_IDS = ['high', 'low', 'medium', 'potato', 'screenshot'];

  fParams.forEach(param => {
    const decoded = decodeURIComponent(param);
    if (decoded.includes('categories:') || decoded.includes('categories!=')) {
      const isExcluded = decoded.includes('categories!=');
      const value = decoded.replace('categories:', '').replace('categories!=', '');
      
      if (STYLE_IDS.includes(value)) {
        if (isExcluded) excludedStyles.push(value);
        else styles.push(value);
      } else if (FEATURE_IDS.includes(value)) {
        if (isExcluded) excludedFeatures.push(value);
        else features.push(value);
      } else if (PERFORMANCE_IDS.includes(value)) {
        if (isExcluded) excludedPerformance.push(value);
        else performance.push(value);
      }
    }
  });

  gParams.forEach(param => {
    const decoded = decodeURIComponent(param);
    if (decoded.includes('categories:')) {
      const value = decoded.replace('categories:', '');
      loaders.push(value);
    } else if (decoded.includes('categories!=')) {
      const value = decoded.replace('categories!=', '');
      excludedLoaders.push(value);
    }
  });

  const lParam = searchParams.l;
  const openSourceState = lParam === 'open_source:true' ? 'selected' : lParam === 'open_source:false' ? 'excluded' : 'none';

  const facets = [['project_type:shader']];
  
  const versionsFacet = versionFacets(versions);
  if (versionsFacet) facets.push(versionsFacet);
  
  if (styles.length > 0) {
    styles.forEach(s => facets.push([`categories:${s}`]));
  }
  
  if (features.length > 0) {
    features.forEach(f => facets.push([`categories:${f}`]));
  }
  
  if (performance.length > 0) {
    performance.forEach(p => facets.push([`categories:${p}`]));
  }
  
  if (loaders.length > 0) {
    loaders.forEach(l => facets.push([`categories:${l}`]));
  }
  
  if (openSourceState === 'selected') {
    facets.push(['open_source:true']);
  }

  let data = null;
  let blockedCount = 0, blockedByProject = 0, blockedByOrganization = 0;
  let layoutCorrection = null;
  let searchAlternatives = []
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
    console.error('Failed to load shaders:', err);
    error = err;
  }

  if (!error && query.trim() && data?.hits?.length === 0 && blockedCount === 0) {
    try {
      searchAlternatives = await findCatalogSearchAlternatives('shaders', query, { version: versions })
    } catch (err) {
      console.error('Failed to load search alternatives:', err)
    }
  }

  const totalPages = data ? Math.ceil(data.total_hits / limit) : 0;

  const buildPageUrl = (newPage) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    appendVersionParams(params, versions);
    styles.forEach(s => params.append('f', `categories:${s}`));
    excludedStyles.forEach(s => params.append('f', `categories!=${s}`));
    features.forEach(f => params.append('f', `categories:${f}`));
    excludedFeatures.forEach(f => params.append('f', `categories!=${f}`));
    performance.forEach(p => params.append('f', `categories:${p}`));
    excludedPerformance.forEach(p => params.append('f', `categories!=${p}`));
    loaders.forEach(l => params.append('g', `categories:${l}`));
    excludedLoaders.forEach(l => params.append('g', `categories!=${l}`));
    if (openSourceState === 'selected') params.set('l', 'open_source:true');
    else if (openSourceState === 'excluded') params.set('l', 'open_source:false');
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    params.set('page', newPage.toString());
    return `/shaders?${params.toString()}`;
  };

  return (
    <>
      <MobileMenu initialVersions={mcVersions} />
      <div className="flex gap-6">
        <ShaderSidebarFilters initialVersions={mcVersions} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Minecraft шейдеры</h1>
                <p className="text-gray-400 text-sm md:text-base">
                  {data ? (
                    <>
                      {data.total_hits.toLocaleString('ru-RU')} шейдеров найдено
                      <CatalogSearchBlockedNote count={blockedCount} />
                    </>
                  ) : (
                    'Загрузка...'
                  )}
                </p>
              </div>
              <SearchInput 
                defaultValue={query}
                placeholder="Поиск шейдеров..."
                categoryPath="shaders"
              />
            </div>

            <SearchLayoutCorrectionNote correction={layoutCorrection} />
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <SortDropdown 
                  currentSort={sortBy} 
                  query={query} 
                  version={versions} 
                  categoryPath="shaders"
                  searchParams={searchParams}
                />
              </div>
              <ActiveFilters categoryPath="shaders" />
            </div>
          </div>

      {error ? (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <svg className="w-16 h-16 mx-auto text-orange-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold text-white mb-2">Не удалось загрузить шейдеры</h2>
            <p className="text-gray-400 mb-6">Попробуйте обновить страницу через несколько секунд</p>
            <ReloadButton />
          </div>
        </div>
      ) : data && data.hits.length === 0 ? (
        <>
          <CatalogSearchAlternatives
            query={query}
            categoryPath="shaders"
            version={versions}
            catalogKey="shaders"
            alternatives={searchAlternatives}
          />
          <div className={searchAlternatives.length > 0 ? 'pb-8' : 'text-center py-16'}>
            <CatalogEmptyResults
              data={data}
              blockedCount={blockedCount}
              blockedByProject={blockedByProject}
              blockedByOrganization={blockedByOrganization}
              foundLabel="найденных шейдеров"
              blockedTitle="Все шейдеры на этой странице заблокированы"
              emptyTitle="Шейдеры не найдены"
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

          <ResourceList resources={data.hits} type="shader" />

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
