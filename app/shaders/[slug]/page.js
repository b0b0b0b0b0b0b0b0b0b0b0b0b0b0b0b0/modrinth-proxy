import { redirect } from 'next/navigation'

export default function OldShaderPage({ params }) {
  redirect(`/shader/${params.slug}`)
}
