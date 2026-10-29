'use client'

import { useEffect, useState } from 'react'

import StyledTooltip from '../components/StyledTooltip'
import { PirateIcon } from '../components/icons'
import { useT } from '../components/I18nProvider'
import { EDITION_EVENT, FLATHUB_URL, FlathubIcon } from './download-section-replacement'
import { detectOS } from './DetectedOS'

const HERO_OS = ['Windows', 'macOS', 'Linux'];

export default function DownloadButtons({ launcherData }) {
  const t = useT()
  const [os, setOs] = useState('Windows')

  useEffect(() => {
    const detected = detectOS()
    if (HERO_OS.includes(detected)) setOs(detected)
  }, [])
  const handleDownload = (url) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleScrollToOptions = () => {
    document.getElementById('download-options')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAstralRinth = () => {
    window.dispatchEvent(new CustomEvent(EDITION_EVENT, { detail: 'astral' }));
    handleScrollToOptions();
  };

  if (!launcherData) return null;

  const targets = {
    Windows: {
      url: launcherData.downloads.windows,
      direct: true,
      label: t('app.dlWin'),
      icon: (
        <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4875 4875" fill="currentColor" aria-hidden>
          <path d="M0 0h2311v2310H0zm2564 0h2311v2310H2564zM0 2564h2311v2311H0zm2564 0h2311v2311H2564"></path>
        </svg>
      ),
    },
    macOS: {
      url: launcherData.downloads.macos,
      direct: true,
      label: t('app.dlMac'),
      icon: (
        <svg className="w-6 h-6 -translate-y-px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
          <path d="M10 2c1 .5 2 2 2 5" />
        </svg>
      ),
    },
    Linux: {
      url: FLATHUB_URL,
      direct: false,
      label: t('app.dlFlathub'),
      icon: <FlathubIcon className="w-6 h-6" />,
    },
  };
  const target = targets[os] || targets.Windows;

  return (
    <>
    <div className="button-group flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
      <button
        onClick={() => (target.direct ? handleDownload(target.url) : window.open(target.url, '_blank', 'noopener,noreferrer'))}
        className="iconified-button brand-button btn btn-large download-glass bg-modrinth-green text-black font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3 text-lg cursor-pointer"
      >
        {target.icon}
        {target.label}
      </button>
      <StyledTooltip
        side="bottom"
        contentClassName="!px-4 !py-3"
        label={
          <span className="flex flex-col items-center gap-1 text-center leading-snug">
            <span className="text-sm font-semibold text-white">{t('app.otherTip')}</span>
            <span className="text-[11px] font-medium tracking-wide text-modrinth-green">
              {[...HERO_OS.filter((name) => name !== os), t('app.andMore')].join(' · ')}
            </span>
          </span>
        }
      >
        <button
          onClick={handleScrollToOptions}
          className="iconified-button outline-button btn btn-large glass-btn text-white font-bold py-4 px-8 rounded-2xl hover:text-modrinth-green text-lg cursor-pointer"
        >
          {t('app.notOs', { os })}
        </button>
      </StyledTooltip>
    </div>

    <div className="flex justify-center mb-12">
      <StyledTooltip
        side="bottom"
        contentClassName="!px-4 !py-3"
        label={
          <span className="flex flex-col items-center gap-1 text-center leading-snug">
            <span className="text-sm font-semibold text-white">{t('app.noLicenseTip')}</span>
            <span className="max-w-[15rem] text-[11px] font-medium text-gray-300">
              {t('app.astralTip')}
            </span>
          </span>
        }
      >
        <button
          onClick={handleAstralRinth}
          className="group glass-chip inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-sm text-gray-300 hover:text-white cursor-pointer"
        >
          <PirateIcon className="w-4 h-4 -translate-y-px text-modrinth-green" />
          <span>
            {t('app.noLicense')}{' '}
            <span className="font-semibold text-modrinth-green">AstralRinth</span> {t('app.withOffline')}
          </span>
          <svg
            className="w-4 h-4 text-gray-500 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-modrinth-green"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
          </svg>
        </button>
      </StyledTooltip>
    </div>
    </>
  );
}
