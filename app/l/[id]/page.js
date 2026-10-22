import { notFound, redirect } from 'next/navigation'
import { resolveList } from '@/lib/sharedLists'

export const dynamic = 'force-dynamic'

export const metadata = {
  robots: 'noindex, nofollow',
}

export default function SharedListPage({ params }) {
  const code = resolveList(params?.id)
  if (!code) notFound()
  redirect(`/account?tab=favorites&list=${code}`)
}
