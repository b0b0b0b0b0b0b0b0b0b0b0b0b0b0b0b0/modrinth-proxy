import { redirect } from 'next/navigation'

export default async function OldPluginPage(props) {
  const params = await props.params
  redirect(`/plugin/${params.slug}`)
}
