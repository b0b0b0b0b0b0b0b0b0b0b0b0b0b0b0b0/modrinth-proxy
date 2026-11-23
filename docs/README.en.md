# ModrinthProxy

**English** · [Русский](../README.md)

A Russian-language web interface for Modrinth. Easy access to mods, plugins, shaders and other Minecraft content without a VPN or extra hassle.

All files are downloaded directly from the Modrinth CDN. We don't host any mods ourselves — we only provide a convenient interface and cache project descriptions.

**Website:** https://modrinth.black/

## For rights holders

> No drama — your work has **not been stolen**. We are only a small **proxy** in front of a great platform.
>
> We simply can’t build the same kind of payment system Modrinth has — royalties for views and downloads require infrastructure way beyond what we can realistically run. And to be clear: we make absolutely nothing from this site. No money from traffic, no money from downloads — we actually pay for the servers ourselves just to keep it alive. So please try to understand us too — we love Minecraft just as much as you do.
>
> Some authors assume we — the people behind this project — **oppose** the content we’re sometimes **forced** to filter. That is **absolutely not** the case: we’re **not against** that work. Restrictions exist only because we’re **obliged** to apply them so **modrinth.com** stays reachable here, **not** because we dislike you or your project.
>
> So extend a bit of goodwill and **please don’t demand we remove your project** from our pages over that alone.

## Quick links

- **[Mods](https://modrinth.black/discover/mods)** - Minecraft modifications
- **[Plugins](https://modrinth.black/discover/plugins)** - server plugins
- **[Modpacks](https://modrinth.black/discover/modpacks)** - ready-made mod collections
- **[Shaders](https://modrinth.black/discover/shaders)** - graphics enhancements
- **[Resource packs](https://modrinth.black/discover/resourcepacks)** - textures and sounds
- **[Data packs](https://modrinth.black/discover/datapacks)** - gameplay mechanics
- **[Servers](https://modrinth.black/discover/servers)** - Minecraft server list

- **[Launcher](https://modrinth.black/app)** - the official Modrinth launcher

## About

Modrinth is one of the best sites for Minecraft mods, but access to it from Russia is crap. This project solves that: it works through Modrinth's public API, shows all content in Russian and filters what the law requires.

**How it works:**
- You open the site and search for a mod
- We request the data through Modrinth API v3
- We show the description, versions and screenshots
- Files are downloaded directly from cdn.modrinth.com
- We store nothing ourselves, only cache metadata (from 3 hours to 7 days depending on the data type)

**Why it's legal:**
- We use Modrinth's public API (no scrapers)
- Files come from their CDN, we don't touch them
- Content is filtered according to RKN requirements via JSON blacklists
- Open source, everything is transparent

## Features

- The full Modrinth catalog - mods, plugins, shaders, resource packs, data packs, modpacks
- Search with filters by Minecraft version, loader (Fabric/Forge/NeoForge/Quilt) and category
- Works on phones and tablets
- Fully Russian interface
- Automatic filtering of prohibited content (RKN blacklist)
- Aggressive caching - we don't put extra load on the Modrinth API

## Running your own copy

If the main site is unavailable or has hit the API limits, you can run your own copy — on your computer or on your own server. All requests to the Modrinth API will come from your IP, so you get your own rate limit.

<details>
<summary><b>Installation and launch</b></summary>

### Requirements

- **Node.js 22 or newer** (any LTS version works: 22, 24, 26). Modern Node.js doesn't install on Windows 7/8 — you need Windows 10 or newer.
- Nothing else. A separate database server is **not needed**.

### Database

The site stores accounts, favorites, likes, download history and settings in **SQLite** — a regular file on disk.

- On first launch, `data/site.db` is created **automatically**, together with the `data/` folder and all tables. Nothing to configure or import.
- When the project is updated, new tables and columns are also added automatically on startup (migrations in `lib/db.js`). Your data is kept.
- The `data/` folder is not tracked by git — every copy of the site has its own database.
- **Backup** — just copy the `data/` folder (preferably while the site is stopped).
- **Start from scratch** — stop the site and delete the `data/` folder. A new empty database will be created on the next launch.
- Want to keep the database somewhere else — set the path in the `DATABASE_FILE` variable (see "Optional settings" under "For pros").

The catalog of mods, plugins and so on is not stored in the database — it always comes from the Modrinth API, so the site shows all content right after launch.

<details>
<summary><b>For pros</b> — git, your own server, environment variables</summary>

### Quick start

```bash
git clone https://github.com/b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0/modrinth-proxy.git
cd modrinth-proxy
npm install
npm run dev
```

The site will be available at `http://localhost:3000`. Sign-up with login and password works right away; the captcha is built in and needs no keys.

### Running on your own server

`npm run dev` is development mode: it's slower and rebuilds pages on the fly. For permanent use, build the site and run it in normal mode:

```bash
npm install
npm run build
npm start
```

By default the site listens on port 3000. You can set another port like this: `npm start -- -p 8080`.

Important:
- **You need a persistent disk.** The database is a file in `data/`, so the site must run on a regular server or VPS where files survive restarts. Free serverless hosting like Vercel, Netlify and Cloudflare Pages is **not suitable**: the catalog will open there, but accounts, favorites and likes won't work.
- **Run a single site process.** Several processes on one database (e.g. pm2 cluster mode) can interfere with each other when the database is updated.
- To have the site start by itself after a server reboot, use a process manager, e.g. `pm2 start npm --name modrinth-proxy -- start` or systemd.
- If nginx or another proxy sits in front of the site, check `TRUSTED_PROXY_HOPS` (see below) — it determines how the site detects the visitor's IP for spam protection.
- After pulling new code from git, run `npm install` and `npm run build` again — the project may have new packages.

### Optional settings

The site works fully without them. If needed, create a `.env.local` file in the project root and add the lines you need:

```bash
# Path to the database file (default: data/site.db)
DATABASE_FILE=/var/lib/modrinth-proxy/site.db

# Sign in with GitHub. Create an OAuth App at github.com/settings/developers,
# set Authorization callback URL to https://your-domain/api/auth/github/callback
GITHUB_OAUTH_CLIENT_ID=
GITHUB_OAUTH_CLIENT_SECRET=

# GitHub token for the site's news page (it's built from the repository's commits) —
# without it a small GitHub API rate limit applies
GITHUB_TOKEN=

# Sign in with Telegram and update notifications in Telegram.
# The token is issued by @BotFather; for the login widget the bot needs the site's domain (/setdomain),
# so Telegram login won't work on localhost
TELEGRAM_BOT_TOKEN=

# How many proxies in front of the site append an address to X-Forwarded-For.
# Default is 2 (e.g. Cloudflare + nginx). If only nginx is in front of the site, set it to 1
TRUSTED_PROXY_HOPS=2
```

Without GitHub and Telegram keys, the corresponding sign-in buttons simply aren't shown.

</details>

<details>
<summary><b>For beginners</b> — step by step, on a clean computer</summary>

**If you're running the project for the first time on a clean computer:**

1. **Install Node.js (if it isn't installed):**
   - Go to the download page [nodejs.org/en/download](https://nodejs.org/en/download)
   - Download and install the **LTS** version (recommended for most users)
   - The installation is standard: just click "Next" in every installer window.

2. **Download the project:**
   - Scroll to the top of this page
   - Click the green **Code** button
   - Choose **Download ZIP**
   - Unpack the downloaded archive

3. **Open a terminal:**
   - Go to the unpacked `modrinth-proxy-master` folder
   - **Windows 10/11:** Right-click an empty spot in the folder → **Open in Terminal** (or click the Explorer address bar at the top, type `cmd` and press Enter)
   - **macOS:** Right-click → **Services** → **New Terminal at Folder**
   - **Linux:** Right-click → **Open Terminal Here**

4. **Install dependencies:**
   ```bash
   npm install
   ```
   Wait until the installation finishes (it can take a few minutes)

5. **Start the site:**
   ```bash
   npm run dev
   ```

6. **Open it in your browser:**
   - Go to: [http://localhost:3000](http://localhost:3000)
   - Done! Your local copy of ModrinthProxy is running, and the database has already been created in the `data/` folder

**Stopping the server:** Press `Ctrl+C` in the terminal, or just close the terminal.

</details>

### If something doesn't start

- **`npm install` fails on `better-sqlite3`** — usually the Node.js version is too old or a too-new "odd" one. Install the current LTS version and run `npm install` again.
- **npm 12 says the `better-sqlite3` scripts are blocked** — the permission is already set in `package.json` (`allowScripts`). If you install the site into another folder with its own `package.json`, copy that field there too.
- **Port 3000 is busy** — run on another port: `npm run dev -- -p 3001`.
- **Access error on `data/`** — the user running the site needs write permission to the project folder (or to the folder from `DATABASE_FILE`).

</details>

## Tech stack

- **Next.js 16** (App Router) - React framework with SSR/SSG
- **React 19**
- **Tailwind CSS 4** - utility-first CSS framework
- **Modrinth API v3** - data source
- **SQLite** (better-sqlite3) - accounts, favorites, likes and settings; the database file is created automatically
- **React Markdown** - rendering descriptions

More about the technologies and infrastructure: [https://modrinth.black/bmadnco](https://modrinth.black/bmadnco)


## Implementation details

### Content filtering

The site blocks content through a blocklist system.

**Blocklist structure:**

All blocklists are stored as JSON files in the `lib/blacklist/` directory:
- `projects-servers.json` - blocked servers
- `projects-mods.json` - blocked mods
- `projects-resourcepacks.json` - blocked resource packs
- `projects-datapacks.json` - blocked data packs
- `projects-modpacks.json` - blocked modpacks
- `organizations.json` - blocked organizations
- `users.json` - blocked users (by ID)
- `username-patterns.json` - usernames and IDs for which the user ID is shown instead of the username (the profile and mods stay)
- `url-patterns.json` - blocked URL patterns (images in descriptions)
- `avatar-patterns.json` - blocked avatar patterns (replaced with `/icon.png`)
- `words.json` - blocked words

**Adding to a blocklist:**

Just edit the corresponding JSON file.

**Projects (by slug or ID):**
```json
[
  "project-slug-1",
  "a1B2c3D4"
]
```
You can add both text aliases (slugs) and unique immutable project IDs (e.g. `a1B2c3D4`), so the block keeps working even after the project's URL or name changes.

**Users (by ID) — full profile block:**
```json
[
  "xzTIfqot"
]
```

**Username masking — mods and profile stay, the ID is shown everywhere instead of the username:**
```json
[
  "forbidden-nick",
  "a1B2c3D4"
]
```
In `username-patterns.json` you can list a username (exact match, case-insensitive) and/or an ID. The user isn't banned: `/user/{id}` links work, and only the ID is shown in the UI.

Blocked content:
- Isn't shown in search results
- A counter of blocked items is shown
- Direct access shows a notice page
- Is filtered automatically on every page of the site
- Blocked users show the RKN page instead of their profile
- Projects of blocked users aren't shown in their profiles
- Blocked images are replaced with a neat notice badge
- Blocked avatars are replaced with the site's default icon (`/icon.png`)
- Masked usernames are shown as IDs (see `username-patterns.json`)

### Caching

API requests are cached via Next.js's built-in system (`revalidate`):
- Minecraft servers: 180 seconds (3 minutes)
- Project search: 10800 seconds (3 hours)
- Project / mod details: 60 seconds (1 minute)
- Project versions: 21600 seconds (6 hours)
- Version details: 21600 seconds (6 hours)
- Project team: 86400 seconds (24 hours)
- Users: 43200 seconds (12 hours)
- Minecraft versions: 86400 seconds (24 hours)
- Categories: 604800 seconds (7 days)
- Project counts on the home page: 86400 seconds (24 hours)

### Handling 429 (rate limit)

All server requests to `api.modrinth.com` go through `ModrinthRouter` (`lib/modrinthRouter.js`, hooked in via `watchModrinthTraffic`). Normally they go straight to Modrinth. `ModrinthBudget` watches the limit: if there were 250 requests in the last minute, if a fresh `x-ratelimit-remaining` header shows 50 or less, or a 429 arrives, `RouteSwitch` moves GET requests to `/v2/` onto the MCIM mirror (`mod.mcimirror.top/modrinth/v2/…`, the `ModrinthMirror` class in `lib/modrinthMirror.js`) for 3 minutes (extended while the load stays high). If the mirror is silent for more than 2 seconds and the limit isn't exhausted yet, Modrinth is queried in parallel and the first good response wins. If the limit is exhausted (a 429 or 5 or fewer requests left) and the mirror didn't help, the router answers 429 right away without spending a request. Mirror copies older than two days are discarded (`MirrorTrust`), with two exceptions: individual versions (`/v2/version/…`, `/v2/versions`) barely change and are accepted at any age, and a project's version list is accepted if it has exactly as many versions as the `?v=` tag from fresh project data says; its service fields are stripped, versions are sorted newest first, responses are kept in memory for 15 minutes (up to 64 MB), and on errors the mirror is temporarily disabled. `MODRINTH_MIRROR=off` disables the mirror. Switches, mirror responses and misses are visible at `/st`. On a 429 the server returns the last successful copy of the project from the in-memory cache. If there's no copy, an error boundary kicks in: the page fetches the project and version data directly from the public Modrinth API (CORS is allowed), passes it to `/api/courier`, the server validates it, runs it through the filters and renders the page as usual. Such data is tied to a single visitor's session and to that project's page, lives for 2 minutes and never gets into the shared cache or the database. If that fails too, a waiting page with auto-retry is shown.
