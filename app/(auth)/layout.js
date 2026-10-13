import { Suspense } from 'react'
import { heldIdentity } from '@/lib/externalAccounts'
import { githubAuthEnabled } from '@/lib/githubAuth'
import { telegramBotId } from '@/lib/telegramAuth'
import AuthCard from './AuthCard'

export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }) {
  const held = heldIdentity()
  return (
    <>
      <Suspense fallback={null}>
        <AuthCard
          github={githubAuthEnabled()}
          telegram={telegramBotId()}
          claim={held ? { name: held.username, provider: held.provider } : null}
        />
      </Suspense>
      {children}
    </>
  )
}
