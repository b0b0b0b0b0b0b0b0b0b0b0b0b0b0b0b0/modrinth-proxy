import PageFade from '../account/PageFade'

export default function SettingsTemplate({ children }) {
  return (
    <PageFade>
      <div className="space-y-6">{children}</div>
    </PageFade>
  )
}
