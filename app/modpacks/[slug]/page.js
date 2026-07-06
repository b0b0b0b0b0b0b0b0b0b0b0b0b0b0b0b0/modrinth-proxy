import { redirect } from 'next/navigation'

export default function OldModpackPage({ params }) {
  redirect(`/modpack/${params.slug}`)
}
