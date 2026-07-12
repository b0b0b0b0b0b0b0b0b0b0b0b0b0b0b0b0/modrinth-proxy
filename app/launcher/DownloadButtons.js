'use client'

import StyledTooltip from '../components/StyledTooltip'
import { PirateIcon } from '../components/icons'

export default function DownloadButtons({ launcherData }) {
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

  if (!launcherData) return null;

  return (
    <>
    <div className="button-group flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
      <button
        onClick={() => handleDownload(launcherData.downloads.windows)}
        className="iconified-button brand-button btn btn-large bg-gradient-to-r from-modrinth-green to-modrinth-green-light text-black font-bold py-4 px-8 rounded-2xl hover:from-modrinth-green-light hover:to-modrinth-green transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center gap-3 text-lg cursor-pointer"
      >
        <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4875 4875" fill="currentColor">
          <path d="M0 0h2311v2310H0zm2564 0h2311v2310H2564zM0 2564h2311v2311H0zm2564 0h2311v2311H2564"></path>
        </svg>
        Скачать Modrinth App
      </button>
      <StyledTooltip
        side="bottom"
        contentClassName="!px-4 !py-3"
        label={
          <span className="flex flex-col items-center gap-1 text-center leading-snug">
            <span className="text-sm font-semibold text-white">Посмотреть другие варианты</span>
            <span className="text-[11px] font-medium tracking-wide text-modrinth-green">
              macOS · Linux · и другие
            </span>
          </span>
        }
      >
        <button
          onClick={handleScrollToOptions}
          className="iconified-button outline-button btn btn-large bg-transparent border-2 border-gray-600 text-white font-bold py-4 px-8 rounded-2xl hover:border-modrinth-green hover:text-modrinth-green transition-all duration-300 text-lg cursor-pointer"
        >
          У меня не Windows
        </button>
      </StyledTooltip>
    </div>

    <div className="flex justify-center mb-12">
      <StyledTooltip
        side="bottom"
        contentClassName="!px-4 !py-3"
        label={
          <span className="flex flex-col items-center gap-1 text-center leading-snug">
            <span className="text-sm font-semibold text-white">Играй без лицензии Minecraft</span>
            <span className="max-w-[15rem] text-[11px] font-medium text-gray-300">
              AstralRinth — тот же лаунчер, но с офлайн-режимом
            </span>
          </span>
        }
      >
        <button
          onClick={handleScrollToOptions}
          className="group inline-flex items-center gap-2.5 rounded-full bg-gray-800/25 px-4 py-2 text-sm text-gray-300 transition-colors duration-300 hover:bg-gray-800/45 hover:text-white cursor-pointer"
        >
          <PirateIcon className="w-4 h-4 text-modrinth-green" />
          <span>
            Нет лицензии Minecraft? Есть{' '}
            <span className="font-semibold text-modrinth-green">AstralRinth</span> с офлайн-режимом
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
