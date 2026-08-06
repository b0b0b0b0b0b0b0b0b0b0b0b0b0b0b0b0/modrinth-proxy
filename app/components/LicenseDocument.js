import { cache } from 'react'
import { parseLicenseDocument, splitLicenseLinks } from '@/lib/parseLicenseDocument'
import { readSiteLicenseText } from '@/lib/siteLicense'

export const getParsedSiteLicense = cache(() => parseLicenseDocument(readSiteLicenseText()))

function LicenseParagraph({ text, className = '' }) {
  const parts = splitLicenseLinks(text)

  return (
    <p className={className}>
      {parts.map((part, index) =>
        part.type === 'link' ? (
          <a
            key={`${part.value}-${index}`}
            href={part.value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-modrinth-green underline decoration-modrinth-green/40 underline-offset-2 transition hover:text-modrinth-green-light"
          >
            {part.value}
          </a>
        ) : (
          <span key={index}>{part.value}</span>
        )
      )}
    </p>
  )
}

function LicenseParagraphs({ paragraphs, className = '' }) {
  return paragraphs.map((paragraph, index) => (
    <LicenseParagraph key={index} text={paragraph} className={className} />
  ))
}

function LicenseSectionBlock({ section }) {
  return (
    <section id={section.id} className="scroll-mt-24 border-t border-gray-800/80 pt-8 first:border-t-0 first:pt-0">
      <h3 className="mb-4 text-lg font-bold text-white md:text-xl">
        <span className="mr-2 font-mono text-modrinth-green">{section.number}.</span>
        {section.title}
      </h3>

      <LicenseParagraphs
        paragraphs={section.paragraphs}
        className="mb-4 text-[15px] leading-7 text-gray-300"
      />

      {section.subsections.length > 0 && (
        <ol className="my-4 space-y-4">
          {section.subsections.map((item) => (
            <li key={item.letter} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-800 font-mono text-xs font-semibold text-modrinth-green">
                {item.letter}
              </span>
              <LicenseParagraph text={item.text} className="text-[15px] leading-7 text-gray-300" />
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function LicenseTableOfContents({ document }) {
  const items = [
    { id: 'license-preamble', label: 'Preamble' },
    ...document.sections.map((section) => ({
      id: section.id,
      label: `${section.number}. ${section.title}`,
    })),
    { id: 'license-how-to-apply', label: 'How to Apply' },
  ]

  return (
    <nav
      aria-label="Содержание лицензии"
      className="rounded-xl border border-gray-800 bg-modrinth-dark/80 p-4 lg:sticky lg:top-24"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Содержание</p>
      <ol className="space-y-1 text-sm">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="block rounded-md px-2 py-1.5 text-gray-400 transition hover:bg-gray-800/80 hover:text-modrinth-green-light"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default function LicenseDocument() {
  const document = getParsedSiteLicense()

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-800 bg-modrinth-dark">
      <div className="border-b border-gray-800 px-5 py-4 md:px-6">
        <h2 className="text-lg font-bold text-white">Полный текст лицензии</h2>
        <p className="mt-1 text-sm text-gray-500">
          Юридически значим только английский оригинал.
        </p>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,240px)_1fr]">
        <div className="border-b border-gray-800 p-4 lg:border-b-0 lg:border-r">
          <LicenseTableOfContents document={document} />
        </div>

        <article className="license-document px-5 py-6 md:px-8 md:py-8">
          {document.notice.length > 0 && (
            <div className="mb-8 rounded-xl border border-modrinth-green/25 bg-modrinth-green/[0.06] p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-modrinth-green/80">
                Notice for modrinth-proxy
              </p>
              <LicenseParagraphs paragraphs={document.notice} className="text-sm leading-7 text-gray-200" />
            </div>
          )}

          <header className="mb-8 text-center">
            {document.title && (
              <h3 className="text-xl font-bold uppercase tracking-wide text-white md:text-2xl">
                {document.title}
              </h3>
            )}
            {document.subtitle && (
              <p className="mt-2 text-sm text-gray-400 md:text-base">{document.subtitle}</p>
            )}
          </header>

          {document.intro.length > 0 && (
            <div className="mb-8 space-y-4">
              <LicenseParagraphs paragraphs={document.intro} className="text-[15px] leading-7 text-gray-300" />
            </div>
          )}

          <section id="license-preamble" className="scroll-mt-24 mb-10">
            <h3 className="mb-4 text-xl font-bold text-white">Preamble</h3>
            <LicenseParagraphs paragraphs={document.preamble} className="mb-4 text-[15px] leading-7 text-gray-300" />
          </section>

          <div className="mb-6">
            <h3 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
              Terms and Conditions
            </h3>
          </div>

          <div className="space-y-8">
            {document.sections.map((section) => (
              <LicenseSectionBlock key={section.id} section={section} />
            ))}
          </div>

          <section id="license-how-to-apply" className="scroll-mt-24 mt-10 border-t border-gray-800 pt-8">
            <h3 className="mb-4 text-xl font-bold text-white">How to Apply These Terms to Your New Programs</h3>
            <LicenseParagraphs
              paragraphs={document.howToApply.paragraphs}
              className="mb-4 text-[15px] leading-7 text-gray-300"
            />

            {document.howToApply.template.length > 0 && (
              <div className="my-6 overflow-hidden rounded-xl border border-gray-800 bg-black/30">
                <div className="border-b border-gray-800 px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                  Пример уведомления в исходниках
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap break-words px-4 py-4 font-mono text-xs leading-relaxed text-gray-400 md:text-sm">
                  {document.howToApply.template.join('\n')}
                </pre>
              </div>
            )}
          </section>
        </article>
      </div>
    </div>
  )
}
