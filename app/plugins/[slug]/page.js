import { redirect } from 'next/navigation'

export default function OldPluginPage({ params }) {
  redirect(`/plugin/${params.slug}`)
}
