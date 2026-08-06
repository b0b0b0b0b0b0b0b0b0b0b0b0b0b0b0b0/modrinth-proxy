import Link from 'next/link'
import { SERVER_TYPES, SERVER_FEATURES, SERVER_GAMEPLAY, SERVER_CONFIG, SERVER_COMMUNITY } from '@/lib/serverCategories'
import { searchServers, getMinecraftVersions } from '@/lib/modrinth'
import { filterModsList } from '@/lib/contentFilter'
import { loadCatalogPage } from '@/lib/loadCatalogPage'
import ServerSidebarFilters from '@/app/servers/ServerSidebarFilters'
import MobileMenu from '@/app/servers/MobileMenu'
import SortDropdown from '@/app/components/SortDropdown'
import ActiveFilters from '@/app/components/ActiveFilters'
import ReloadButton from '@/app/components/ReloadButton'
import SearchInput from '@/app/components/SearchInput'
import CatalogSearchBlockedNote from '@/app/components/CatalogSearchBlockedNote'
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
      title,
      description,
      type: 'website',
    },
  }
}

export default async function ServersPage({ searchParams }) {
  const query = searchParams.q || '';
  const version = searchParams.sgv || searchParams.v || '';
  const sst = (searchParams.sst === 'online' || searchParams.sst === 'offline') ? searchParams.sst : 'online';
  const sort = searchParams.sort || (searchParams.sst && !['online', 'offline'].includes(searchParams.sst) ? searchParams.sst : 'relevance');
  
  let sortBy = 'relevance';
  if (sort === 'plays') sortBy = 'minecraft_java_server.verified_plays_2w';
  else if (sort === 'players') sortBy = 'minecraft_java_server.ping.data.players_online';
  else if (sort === 'followers' || sort === 'follows') sortBy = 'follows';
  else if (sort === 'newest' || sort === 'created') sortBy = 'date_created';
  else if (sort === 'updated') sortBy = 'date_modified';
  else sortBy = 'relevance';

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
  

  const scParams = Array.isArray(searchParams.sc) ? searchParams.sc : (searchParams.sc ? [searchParams.sc] : []);
  const sctParams = Array.isArray(searchParams.sct) ? searchParams.sct : (searchParams.sct ? [searchParams.sct] : []);
  const fParams = Array.isArray(searchParams.f) ? searchParams.f : (searchParams.f ? [searchParams.f] : []);
  const srParams = Array.isArray(searchParams.sr) ? searchParams.sr : (searchParams.sr ? [searchParams.sr] : []);
  const slParams = Array.isArray(searchParams.sl) ? searchParams.sl : (searchParams.sl ? [searchParams.sl] : []);
  
  let categories = [...scParams];
  let excludedCategories = [];
  
  fParams.forEach(param => {
    const decoded = decodeURIComponent(param);
    if (decoded.includes('categories:')) {
      const value = decoded.replace('categories:', '');
      if (!categories.includes(value)) {
        categories.push(value);
      }
    } else if (decoded.includes('categories!=')) {
      const value = decoded.replace('categories!=', '');
      excludedCategories.push(value);
    }
  });

  const parts = ['project_types = minecraft_java_server'];

  if (sst === 'online') {
    parts.push('minecraft_java_server.ping.data EXISTS');
  } else if (sst === 'offline') {
    parts.push('minecraft_java_server.ping.data NOT EXISTS');
  }

  if (version) {
    parts.push(`minecraft_java_server.content.supported_game_versions IN ["${version}"]`);
  }

  if (srParams.length > 0) {
    const values = srParams.map(r => `"${r}"`).join(', ');
    parts.push(`minecraft_server.region IN [${values}]`);
  }

  if (slParams.length > 0) {
    const values = slParams.map(l => `"${l}"`).join(', ');
    parts.push(`minecraft_server.languages IN [${values}]`);
  }

  if (sctParams.length > 0) {
    const values = sctParams.map(t => `"${t}"`).join(', ');
    parts.push(`minecraft_java_server.content.kind IN [${values}]`);
  }

  const inclFeatures = categories.filter(c => SERVER_FEATURES.some(f => f.id === c));
  if (inclFeatures.length > 0) {
    parts.push(`categories IN [${inclFeatures.map(c => `"${c}"`).join(', ')}]`);
  }

  const inclGameplay = categories.filter(c => SERVER_GAMEPLAY.some(g => g.id === c));
  if (inclGameplay.length > 0) {
    parts.push(`categories IN [${inclGameplay.map(c => `"${c}"`).join(', ')}]`);
  }

  const inclConfig = categories.filter(c => SERVER_CONFIG.some(x => x.id === c));
  if (inclConfig.length > 0) {
    parts.push(`categories IN [${inclConfig.map(c => `"${c}"`).join(', ')}]`);
  }

  const inclCommunity = categories.filter(c => SERVER_COMMUNITY.some(x => x.id === c));
  if (inclCommunity.length > 0) {
    parts.push(`categories IN [${inclCommunity.map(c => `"${c}"`).join(', ')}]`);
  }

  const inclOther = categories.filter(c => 
    !SERVER_FEATURES.some(f => f.id === c) &&
    !SERVER_GAMEPLAY.some(g => g.id === c) &&
    !SERVER_CONFIG.some(x => x.id === c) &&
    !SERVER_COMMUNITY.some(x => x.id === c) &&
    !SERVER_TYPES.some(t => t.id === c)
  );
  if (inclOther.length > 0) {
    parts.push(`categories IN [${inclOther.map(c => `"${c}"`).join(', ')}]`);
  }

  const exclFeatures = excludedCategories.filter(c => SERVER_FEATURES.some(f => f.id === c));
  if (exclFeatures.length > 0) {
    parts.push(`categories NOT IN [${exclFeatures.map(c => `"${c}"`).join(', ')}]`);
  }

  const exclGameplay = excludedCategories.filter(c => SERVER_GAMEPLAY.some(g => g.id === c));
  if (exclGameplay.length > 0) {
    parts.push(`categories NOT IN [${exclGameplay.map(c => `"${c}"`).join(', ')}]`);
  }

  const exclConfig = excludedCategories.filter(c => SERVER_CONFIG.some(x => x.id === c));
  if (exclConfig.length > 0) {
    parts.push(`categories NOT IN [${exclConfig.map(c => `"${c}"`).join(', ')}]`);
  }

  const exclCommunity = excludedCategories.filter(c => SERVER_COMMUNITY.some(x => x.id === c));
  if (exclCommunity.length > 0) {
    parts.push(`categories NOT IN [${exclCommunity.map(c => `"${c}"`).join(', ')}]`);
  }

  const exclOther = excludedCategories.filter(c => 
    !SERVER_FEATURES.some(f => f.id === c) &&
    !SERVER_GAMEPLAY.some(g => g.id === c) &&
    !SERVER_CONFIG.some(x => x.id === c) &&
    !SERVER_COMMUNITY.some(x => x.id === c) &&
    !SERVER_TYPES.some(t => t.id === c)
  );
  if (exclOther.length > 0) {
    parts.push(`categories NOT IN [${exclOther.map(c => `"${c}"`).join(', ')}]`);
  }

  const newFilters = parts.join(' AND ');

  const {
    data,
    blockedCount,
    blockedByProject,
    blockedByOrganization,
    error,
  } = await loadCatalogPage({
    searchBatch: (opts) => searchServers({ query, newFilters, index: sortBy, ...opts }),
    page,
    limit,
    filterList: filterModsList,
    logLabel: 'servers',
  })

  const totalPages = data ? Math.ceil(data.total_hits / limit) : 0;

  const buildPageUrl = (newPage) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (version) params.set('sgv', version);
    
    categories.forEach(c => {
      params.append('sc', c);
    });

    sctParams.forEach(t => {
      params.append('sct', t);
    });
    
    if (sst) params.set('sst', sst);
    
    srParams.forEach(r => {
      params.append('sr', r);
    });
    
    slParams.forEach(l => {
      params.append('sl', l);
    });
    
    if (sort && sort !== 'relevance') params.set('sort', sort);
    params.set('page', newPage.toString());
    return `/discover/servers?${params.toString()}`;
  };

  return (
    <>
      <MobileMenu initialVersions={mcVersions} />
      <div className="flex gap-6">
        <ServerSidebarFilters initialVersions={mcVersions} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col gap-3">
              <h1 className="text-2xl md:text-3xl font-bold">Серверы майнкрафт</h1>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <p className="text-gray-400 text-sm md:text-base shrink-0">
                  {data ? (
                    <>
                      {data.total_hits.toLocaleString('ru-RU')} серверов найдено
                      <CatalogSearchBlockedNote count={blockedCount} />
                    </>
                  ) : (
                    'Загрузка...'
                  )}
                </p>
                <div className="w-full sm:max-w-md sm:flex-1 sm:min-w-[220px]">
                  <SearchInput
                    defaultValue={query}
                    placeholder="Поиск серверов..."
                    categoryPath="discover/servers"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <SortDropdown 
                  currentSort={sort} 
                  query={query} 
                  version={version} 
                  categoryPath="discover/servers"
                  searchParams={searchParams}
                />
              </div>
              <ActiveFilters categoryPath="discover/servers" />
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
