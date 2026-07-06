import { redirect } from 'next/navigation'

export default function OldResourcepackPage({ params }) {
  redirect(`/resourcepack/${params.slug}`)
}
