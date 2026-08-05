import { MODRINTH_API, MODRINTH_USER_AGENT, normalizeProject, searchMods } from './modrinth'

const KNOWN_LOADERS = new Set([
  'bukkit', 'spigot', 'paper', 'purpur', 'folia',
  'forge', 'fabric', 'quilt', 'neoforge', 'datapack',
])

function withLoadersFromCategories(project) {
  if (project.loaders?.length) return project
  const loaders = (project.categories || []).filter((id) => KNOWN_LOADERS.has(id))
  return loaders.length > 0 ? { ...project, loaders } : project
}

function normalizeAuthorProject(project) {
  const normalized = normalizeProject(withLoadersFromCategories(project))
  return {
    ...normalized,
    project_type: determineActualProjectType(normalized),
  }
}

async function fetchUserProjectsFromApi(userId) {
  const url = `${MODRINTH_API}/user/${userId}/projects`

  const response = await fetch(url, {
    headers: {
      'User-Agent': MODRINTH_USER_AGENT,
    },
    signal: AbortSignal.timeout(15000),
    next: { revalidate: 10800 },
  })

  if (!response.ok) {
    throw new Error(`Author projects fetch error: ${response.status}`)
  }

  const projects = await response.json()
  return Array.isArray(projects) ? projects : []
}

async function fetchUserProjectsFromSearch(username) {
  const data = await searchMods({
    facets: [[`author:${username}`]],
    limit: 10000,
    offset: 0,
  })

  return data.hits ?? []
}

export async function getAuthorProjects(userId, { projectType = null, limit = 20, offset = 0 } = {}) {
  try {
    let rawProjects = await fetchUserProjectsFromApi(userId)

    if (rawProjects.length === 0) {
      const author = await getAuthorInfo(userId)
      if (author?.username) {
        rawProjects = await fetchUserProjectsFromSearch(author.username)
      }
    }

    const projectsWithCorrectType = rawProjects.map(normalizeAuthorProject)

    let filteredProjects = projectsWithCorrectType
    if (projectType) {
      filteredProjects = projectsWithCorrectType.filter(
        (project) => project.project_type === projectType,
      )
    }

    const startIndex = offset
    const endIndex = offset + limit
    const paginatedProjects = filteredProjects.slice(startIndex, endIndex)

    return {
      hits: paginatedProjects,
      total_hits: filteredProjects.length,
    }
  } catch (error) {
    console.error('Author projects fetch error:', error)
    return { hits: [], total_hits: 0 }
  }
}

function getPrimaryProjectType(project) {
  return (
    project.project_type ??
    (Array.isArray(project.project_types) ? project.project_types[0] : undefined)
  )
}

function determineActualProjectType(project) {
  const primaryType = getPrimaryProjectType(project)

  if (primaryType === 'minecraft_java_server') {
    return 'minecraft_java_server'
  }

  if (!project.loaders || project.loaders.length === 0) {
    return primaryType
  }

  const pluginLoaders = ['bukkit', 'spigot', 'paper', 'purpur', 'folia'];
  const modLoaders = ['forge', 'fabric', 'quilt', 'neoforge'];
  
  const hasPluginLoader = project.loaders.some(loader => pluginLoaders.includes(loader));
  const hasModLoader = project.loaders.some(loader => modLoaders.includes(loader));

  if (hasPluginLoader && !hasModLoader) {
    return 'plugin';
  }
  
  if (hasModLoader && !hasPluginLoader) {
    return 'mod';
  }

  return primaryType;
}

export async function getAuthorInfo(userIdOrUsername) {
  const url = `${MODRINTH_API}/user/${userIdOrUsername}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': MODRINTH_USER_AGENT,
      },
      signal: AbortSignal.timeout(15000),
      next: { revalidate: 43200 },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Author info fetch error:', error);
    return null;
  }
}

export function getProjectTypeStats(projects) {
  const stats = {
    mod: 0,
    plugin: 0,
    modpack: 0,
    resourcepack: 0,
    shader: 0,
    datapack: 0,
    minecraft_java_server: 0,
  };

  projects.forEach(project => {
    if (stats.hasOwnProperty(project.project_type)) {
      stats[project.project_type]++;
    }
  });

  return stats;
}

export function getTotalDownloads(projects) {
  return projects.reduce((total, project) => total + (project.downloads || 0), 0);
}

export function formatAuthorStats(user, projects) {
  const totalDownloads = getTotalDownloads(projects);
  const projectCount = projects.length;
  
  return {
    projectCount,
    totalDownloads,
    joinDate: user.created,
    typeStats: getProjectTypeStats(projects)
  };
}

export function getProjectTypeDisplayName(type) {
  const names = {
    mod: 'Моды',
    plugin: 'Плагины', 
    modpack: 'Модпаки',
    resourcepack: 'Ресурспаки',
    shader: 'Шейдеры',
    datapack: 'Датапаки',
    minecraft_java_server: 'Серверы',
  };
  return names[type] || type;
}

export function getProjectTypePath(type) {
  const paths = {
    mod: 'mods',
    plugin: 'plugins',
    modpack: 'modpacks', 
    resourcepack: 'resourcepacks',
    shader: 'shaders',
    datapack: 'datapacks',
    minecraft_java_server: 'servers',
  };
  return paths[type] || 'mods';
}

export async function getUserOrganizations(userId) {

  try {
    const projects = await getAuthorProjects(userId);
    const organizations = new Set();
    
    for (const project of projects.hits || []) {
      if (project.organization) {
        organizations.add(project.organization);
      }
    }
    
    return Array.from(organizations);
  } catch (error) {
    console.error('Error getting organizations from projects:', error);
    return [];
  }
}

export async function getOrganizationInfo(orgId) {
  try {
    const searchUrl = `${MODRINTH_API}/search?facets=[["organization:${orgId}"]]&limit=1`;
    console.log(`Searching for organization projects: ${searchUrl}`);
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': MODRINTH_USER_AGENT,
      },
      signal: AbortSignal.timeout(15000),
      next: { revalidate: 43200 },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`Organization search data:`, data);
      
      if (data.hits && data.hits.length > 0) {
        const firstProject = data.hits[0];
        
        const orgName = getOrganizationNameFromId(orgId);
        return {
          id: orgId,
          name: orgName,
          title: orgName,
          icon_url: firstProject.icon_url,
          project_count: data.total_hits,
          description: `Организация с ${data.total_hits} проект${data.total_hits === 1 ? 'ом' : data.total_hits < 5 ? 'ами' : 'ами'}`
        };
      }
    }
  } catch (error) {
    console.error('Error searching for organization projects:', error);
  }
  
  const orgName = getOrganizationNameFromId(orgId);
  return {
    id: orgId,
    name: orgName,
    title: orgName,
    icon_url: null
  };
}

function getOrganizationNameFromId(orgId) {
 
  const knownOrgs = {
    'LjcZDkRW': 'CaffeineMC',
    
  };
  
  return knownOrgs[orgId] || `Organization ${orgId}`;
}
