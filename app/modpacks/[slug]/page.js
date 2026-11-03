import { redirect } from 'next/navigation'

export default async function OldModpackPage(props) {
  const params = await props.params
  redirect(`/modpack/${params.slug}`)
}
