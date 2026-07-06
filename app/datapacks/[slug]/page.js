import { redirect } from 'next/navigation'

export default function OldDatapackPage({ params }) {
  redirect(`/datapack/${params.slug}`)
}
