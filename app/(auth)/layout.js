import { Suspense } from 'react'
import { githubAuthEnabled } from '@/lib/githubAuth'
import AuthCard from './AuthCard'

export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }) {
  return (
    <>
      <Suspense fallback={null}>
        <AuthCard github={githubAuthEnabled()} />
      </Suspense>
      {children}
    </>
  )
}
