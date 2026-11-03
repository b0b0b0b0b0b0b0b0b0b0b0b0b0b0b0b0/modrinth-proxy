import { redirect } from 'next/navigation'

export default async function OldDatapackPage(props) {
  const params = await props.params
  redirect(`/datapack/${params.slug}`)
}
