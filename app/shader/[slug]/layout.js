import ProjectBackdropLayoutShell from '@/app/components/ProjectBackdropLayoutShell'

export default async function ShaderSlugLayout(props) {
  const params = await props.params
  const { children } = props

  return (
    <ProjectBackdropLayoutShell slug={params.slug}>{children}</ProjectBackdropLayoutShell>
  )
}
