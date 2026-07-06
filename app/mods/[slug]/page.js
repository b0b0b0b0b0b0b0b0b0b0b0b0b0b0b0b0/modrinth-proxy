import { redirect } from 'next/navigation'

export default function OldModPage({ params }) {
  redirect(`/mod/${params.slug}`)
}
