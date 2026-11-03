import { redirect } from 'next/navigation'

export default async function OldModPage(props) {
  const params = await props.params
  redirect(`/mod/${params.slug}`)
}
