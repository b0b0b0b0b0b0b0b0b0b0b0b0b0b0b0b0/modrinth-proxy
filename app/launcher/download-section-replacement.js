'use client'

import DownloadButtonWithPopover from '../components/DownloadButtonWithPopover'
import { WindowsIcon, MacOSIcon, LinuxIcon } from '../components/icons'

const ASTRALRINTH_FALLBACK = {
  windows:
    'https://git.xorison.dev/didirus/AstralRinth/releases/download/AR-0.10.1601/AstralRinth%20App_0.10.1601_x64-setup.exe',
  macos:
    'https://git.xorison.dev/didirus/AstralRinth/releases/download/AR-0.10.1601/AstralRinth%20App_0.10.1601_aarch64.dmg',
  appimage:
    'https://git.xorison.dev/didirus/AstralRinth/releases/download/AR-0.10.1601/AstralRinth%20App_0.10.1601_amd64.AppImage',
  deb: 'https://git.xorison.dev/didirus/AstralRinth/releases/download/AR-0.10.1601/AstralRinth%20App_0.10.1601_amd64.deb',
  rpm: 'https://git.xorison.dev/didirus/AstralRinth/releases/download/AR-0.10.1601/AstralRinth%20App-0.10.1601-1.x86_64.rpm',
}

export const DownloadSection = ({ launcherData, astralData }) => {
  const astral = astralData?.downloads
  const astralUrls = {
    windows: astral?.windows || ASTRALRINTH_FALLBACK.windows,
    macos: astral?.macos || ASTRALRINTH_FALLBACK.macos,
    appimage: astral?.linux?.appimage || ASTRALRINTH_FALLBACK.appimage,
    deb: astral?.linux?.deb || ASTRALRINTH_FALLBACK.deb,
    rpm: astral?.linux?.rpm || ASTRALRINTH_FALLBACK.rpm,
  }

  if (!launcherData) {
    return (
      <div className="col-span-3 text-center py-12">
        <p className="text-gray-400">Не удалось загрузить информацию о версиях</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-3xl p-8 flex flex-col items-center text-center w-full md:w-auto">
        <span id="download-os-windows" className="inline-flex"><WindowsIcon /></span>
        <h3 className="text-2xl font-bold text-white mb-2">Windows</h3>
        <p className="text-gray-400 mb-6">Установщик для Windows 64-bit</p>
        <DownloadButtonWithPopover
          buttonText="Скачать для Windows"
          officialUrl={launcherData.downloads.windows}
          pirateUrl={astralUrls.windows}
        />
      </div>

      <div className="divider hidden md:block"></div>

      <div className="rounded-3xl p-8 flex flex-col items-center text-center w-full md:w-auto">
        <span id="download-os-macos" className="inline-flex"><MacOSIcon /></span>
        <h3 className="text-2xl font-bold text-white mb-2">macOS</h3>
        <p className="text-gray-400 mb-6">Универсальный DMG для macOS</p>
        <DownloadButtonWithPopover
          buttonText="Скачать для macOS"
          officialUrl={launcherData.downloads.macos}
          pirateUrl={astralUrls.macos}
        />
      </div>

      <div className="divider hidden md:block"></div>

      <div className="rounded-3xl p-8 flex flex-col items-center text-center w-full md:w-auto">
        <span id="download-os-linux" className="inline-flex"><LinuxIcon /></span>
        <h3 className="text-2xl font-bold text-white mb-2">Linux<span className="text-sm text-gray-500 ml-2">*</span></h3>
        <p className="text-gray-400 mb-6">AppImage, DEB и RPM пакеты</p>
        <div className="w-full">
          <DownloadButtonWithPopover
            buttonText="AppImage"
            officialUrl={launcherData.downloads.linux.appimage}
            pirateUrl={astralUrls.appimage}
          />
          <div className="-mt-4">
            <DownloadButtonWithPopover
              buttonText="DEB"
              officialUrl={launcherData.downloads.linux.deb}
              pirateUrl={astralUrls.deb}
            />
          </div>
          <div className="-mt-4">
            <DownloadButtonWithPopover
              buttonText="RPM"
              officialUrl={launcherData.downloads.linux.rpm}
              pirateUrl={astralUrls.rpm}
            />
          </div>
        </div>
        <a
          href="https://support.modrinth.com/en/articles/9298760"
          target="_blank"
          rel="noopener noreferrer"
          className="download-link-sm mt-2 w-full"
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            <span>Сторонние пакеты</span>
          </div>
        </a>
      </div>
    </>
  )
}
