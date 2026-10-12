import { Suspense } from 'react'
import AuthCard from './AuthCard'

export default function AuthLayout({ children }) {
  return (
    <>
      <Suspense fallback={null}>
        <AuthCard />
      </Suspense>
      {children}
    </>
  )
}
