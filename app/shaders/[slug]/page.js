import { redirect } from 'next/navigation'

export default async function OldShaderPage(props) {
  const params = await props.params
  redirect(`/shader/${params.slug}`)
}
