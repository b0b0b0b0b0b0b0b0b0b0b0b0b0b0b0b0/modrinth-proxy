export async function getLauncherData() {
  try {
    const response = await fetch('https://api.github.com/repos/modrinth/code/releases/latest', {
      headers: {
        'User-Agent': 'ModrinthProxy/1.0',
        'Accept': 'application/vnd.github.v3+json',
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    const version = data.tag_name.replace(/^v/, '');

    return {
      version,
      tag_name: data.tag_name,
      name: data.name,
      published_at: data.published_at,
      html_url: data.html_url,
      body: data.body,
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
  } catch (error) {
    console.error('Error fetching launcher data:', error);
    return null;
  }
}
