const RELEASE_URL = 'https://api.github.com/repos/modrinth/code/releases/latest'

const REVALIDATE_SECONDS = 86400
const REQUEST_TIMEOUT_MS = 8000
const MIN_RETRY_INTERVAL_MS = 5 * 60 * 1000

let lastGood = null
let lastAttemptAt = 0

export async function getLauncherData() {
  const now = Date.now()
  if (lastGood && now - lastAttemptAt < MIN_RETRY_INTERVAL_MS) {
    return lastGood
  }
  lastAttemptAt = now

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(RELEASE_URL, {
      headers: {
        'User-Agent': 'ModrinthProxy/1.0',
        Accept: 'application/vnd.github.v3+json',
      },
      signal: controller.signal,
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    const version = data.tag_name.replace(/^v/, '');

    const result = {
      version,
      tag_name: data.tag_name,
      published_at: data.published_at,
      html_url: data.html_url,
      source: 'modrinth',
      downloads: {
        windows: `https://launcher-files.modrinth.com/versions/${version}/windows/Modrinth%20App_${version}_x64-setup.exe`,
        macos: `https://launcher-files.modrinth.com/versions/${version}/macos/Modrinth%20App_${version}_universal.dmg`,
        linux: {
          appimage: `https://launcher-files.modrinth.com/versions/${version}/linux/Modrinth%20App_${version}_amd64.AppImage`,
          deb: `https://launcher-files.modrinth.com/versions/${version}/linux/Modrinth%20App_${version}_amd64.deb`,
          rpm: `https://launcher-files.modrinth.com/versions/${version}/linux/Modrinth%20App-${version}-1.x86_64.rpm`,
        },
      },
    };

    lastGood = result;
    return result;
  } catch (error) {
    console.error('Error fetching launcher data:', error?.message || error);
    return lastGood;
  } finally {
    clearTimeout(timeout);
  }
}
