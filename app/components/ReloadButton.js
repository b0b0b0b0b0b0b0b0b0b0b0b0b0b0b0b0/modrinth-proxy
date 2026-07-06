'use client'

export default function ReloadButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="px-6 py-3 bg-modrinth-green hover:bg-green-600 text-black font-semibold rounded-lg transition-colors"
    >
      Обновить страницу
    </button>
  )
}
