import MarkdownContent from './MarkdownContent'
import { ArchiveBannerIcon } from './ProjectDisclosureIcons'

export default function ProjectArchivedBanner({ title, note }) {
  if (!title) return null

  return (
    <div className="relative grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-2 rounded-2xl border border-solid border-sky-500/40 bg-sky-500/10 p-4 text-[var(--text-primary)] items-start mt-4 mb-4">
      <ArchiveBannerIcon />
      <div className="col-start-2 min-w-0 flex flex-1 flex-col gap-2">
        <div className="text-lg font-semibold leading-6">{title} помещён в архив</div>
        {note?.trim() ? (
          <div className="font-normal text-[var(--text-primary)]/85 leading-tight">
            <MarkdownContent
              className="prose prose-invert prose-sm max-w-none [&_p]:m-0 [&_a]:text-modrinth-green [&_a]:hover:underline"
              content={note}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
