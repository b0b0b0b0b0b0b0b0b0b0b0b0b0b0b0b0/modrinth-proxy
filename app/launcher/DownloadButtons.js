'use client'

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
    <div className="button-group flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
      <button
        onClick={() => handleDownload(launcherData.downloads.windows)}
        className="iconified-button brand-button btn btn-large bg-gradient-to-r from-modrinth-green to-modrinth-green-light text-black font-bold py-4 px-8 rounded-2xl hover:from-modrinth-green-light hover:to-modrinth-green transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center gap-3 text-lg cursor-pointer"
      >
        <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4875 4875" fill="currentColor">
          <path d="M0 0h2311v2310H0zm2564 0h2311v2310H2564zM0 2564h2311v2311H0zm2564 0h2311v2311H2564"></path>
        </svg>
        Скачать Modrinth App
      </button>
      <button
        onClick={handleScrollToOptions}
        className="iconified-button outline-button btn btn-large bg-transparent border-2 border-gray-600 text-white font-bold py-4 px-8 rounded-2xl hover:border-modrinth-green hover:text-modrinth-green transition-all duration-300 text-lg cursor-pointer"
      >
        Больше вариантов загрузки
      </button>
    </div>
  );
}
