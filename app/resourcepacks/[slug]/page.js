import { redirect } from 'next/navigation'

export default async function OldResourcepackPage(props) {
  const params = await props.params
  redirect(`/resourcepack/${params.slug}`)
}
