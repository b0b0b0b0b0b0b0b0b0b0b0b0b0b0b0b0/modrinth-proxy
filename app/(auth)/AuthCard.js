'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useT } from '../components/I18nProvider'
import StyledTooltip from '../components/StyledTooltip'
import { safeNext } from '@/lib/safeNext'
import { signInWithTelegram } from '@/lib/telegramPopup'
import { useCaptcha } from './useCaptcha'
import GuardKitten from './GuardKitten'
import PasswordInput, { FieldIcon, fieldInputClass, PasswordStrength } from '../components/PasswordInput'

const ERROR_KEYS = {
  invalid: 'account.errInvalid',
  taken: 'account.errTaken',
  username: 'account.errUsername',
  password: 'account.errPassword',
  rate_limit: 'account.errRate',
  captcha: 'account.errCaptcha',
  signup_limit: 'account.errSignupLimit',
  github: 'account.errGithub',
  telegram: 'account.errTelegram',
}

const PROVIDER_NAMES = { github: 'GitHub', telegram: 'Telegram' }
const AUTO_BUTTON =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-700 bg-[var(--bg-primary)] text-white transition-colors hover:border-modrinth-green hover:text-modrinth-green disabled:opacity-50 dark:border-gray-800'
const TELEGRAM_ICON =
  'M21.94 4.3 18.6 20.05c-.25 1.1-.9 1.38-1.83.86l-5.05-3.72-2.44 2.35c-.27.27-.5.5-1.02.5l.36-5.15 9.37-8.47c.4-.36-.09-.56-.63-.2L5.78 13.5.8 11.95c-1.08-.34-1.1-1.08.23-1.6L20.5 2.84c.9-.33 1.69.21 1.44 1.46Z'

const GITHUB_ICON =
  'M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z'

const PERKS = [
  {
    key: 'perkHearts',
    path: 'M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z',
  },
  {
    key: 'perkUpdates',
    path: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',
  },
  {
    key: 'perkHistory',
    path: 'M12 8v4l3 2M3.05 11a9 9 0 1 1 .5 4M3 4v5h5',
  },
]

export default function AuthCard({ github = false, telegram = null, claim = null }) {
  const t = useT()
  const router = useRouter()
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()
  const searchParams = useSearchParams()
  const next = safeNext(searchParams.get('next'))
  const errorParam = searchParams.get('error')
  const initialError = errorParam && Object.hasOwn(ERROR_KEYS, errorParam) ? ERROR_KEYS[errorParam] : null
  const mode = pathname === '/register' ? 'register' : 'login'
  const isRegister = mode === 'register'

  const [held, setHeld] = useState(claim)
  const [username, setUsername] = useState(claim?.name || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [focused, setFocused] = useState(null)
  const [error, setError] = useState(() => ({ text: initialError ? t(initialError) : '', id: 0 }))
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [website, setWebsite] = useState('')
  const captcha = useCaptcha(mode)

  const query = next ? `?next=${encodeURIComponent(next)}` : ''

  const fail = (key) => setError((prev) => ({ text: t(key), id: prev.id + 1 }))

  const telegramLogin = async () => {
    if (busy || done) return
    setError((prev) => ({ text: '', id: prev.id }))
    const outcome = await signInWithTelegram(telegram, next)
    if (outcome.result === 'session') {
      setDone(true)
      router.push(next || '/account')
      router.refresh()
    } else if (outcome.result === 'held') {
      setHeld({ name: outcome.name, provider: 'telegram' })
      setUsername(outcome.name)
      if (isRegister) router.push(`/login${query}`)
    } else if (outcome.result === 'error') {
      fail(Object.hasOwn(ERROR_KEYS, outcome.error) ? ERROR_KEYS[outcome.error] : 'account.errTelegram')
    }
  }

  const createFromHeld = async () => {
    if (busy || done) return
    setBusy(true)
    setError((prev) => ({ text: '', id: prev.id }))
    try {
      const response = await fetch('/api/auth/claim', { method: 'POST' })
      if (response.ok) {
        setDone(true)
        router.push(next || '/account')
        router.refresh()
        return
      }
      const data = await response.json().catch(() => null)
      fail(ERROR_KEYS[data?.error] || 'account.errGeneric')
    } catch {
      fail('account.errGeneric')
    } finally {
      setBusy(false)
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    if (busy || done) return
    setBusy(true)
    setError((prev) => ({ text: '', id: prev.id }))
    try {
      const proof = await captcha.takeProof()
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          website,
          captcha: proof,
          linkHeld: Boolean(held) && !isRegister,
        }),
      })
      if (response.ok) {
        setDone(true)
        router.push(next || '/account')
        router.refresh()
        return
      }
      const data = await response.json().catch(() => null)
      fail(ERROR_KEYS[data?.error] || 'account.errGeneric')
      captcha.prepare()
    } catch {
      fail('account.errGeneric')
      captcha.prepare()
    } finally {
      setBusy(false)
    }
  }

  const rise = (delay) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.35, delay, ease: 'easeOut' },
        }

  return (
    <div className="relative mx-auto max-w-4xl px-1 py-8 md:py-14">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-[8%] top-6 h-56 w-56 rounded-full blur-3xl"
        style={{ background: 'rgba(var(--color-green-rgb), 0.22)' }}
        animate={reduceMotion ? undefined : { x: [0, 40, 0], y: [0, 24, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-4 right-[6%] h-64 w-64 rounded-full blur-3xl"
        style={{ background: 'rgba(var(--color-green-light-rgb), 0.18)' }}
        animate={reduceMotion ? undefined : { x: [0, -36, 0], y: [0, -28, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="relative overflow-hidden rounded-3xl p-px shadow-2xl"
        initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-1/2 aspect-square w-[160%]"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0deg, var(--color-green) 60deg, transparent 120deg, transparent 180deg, var(--color-green-light) 240deg, transparent 300deg)',
            x: '-50%',
            y: '-50%',
          }}
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
        />

        <div className="relative grid overflow-hidden rounded-[calc(1.5rem-1px)] bg-modrinth-dark md:grid-cols-[0.9fr_1.1fr]">
          <div
            className="relative hidden flex-col overflow-hidden p-8 md:flex"
            style={{
              background:
                'linear-gradient(140deg, rgba(var(--color-green-rgb), 0.22), rgba(var(--color-green-light-rgb), 0.10) 60%, transparent)',
            }}
          >
            <div>
              <motion.div
                {...rise(0.1)}
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-modrinth-green text-black shadow-lg"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </motion.div>
              <motion.h2 {...rise(0.16)} className="mt-6 text-2xl font-bold leading-tight text-white">
                {t('account.sideTitle')}
              </motion.h2>
              <motion.p {...rise(0.22)} className="mt-2 text-sm leading-relaxed text-gray-400">
                {t('account.sideLead')}
              </motion.p>
            </div>

            <ul className="mt-8 space-y-4">
              {PERKS.map((perk, index) => (
                <motion.li key={perk.key} {...rise(0.3 + index * 0.08)} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-modrinth-green/30 bg-modrinth-green/10 text-modrinth-green">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
                      <path d={perk.path} />
                    </svg>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">{t(`account.${perk.key}`)}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-gray-400">{t(`account.${perk.key}Text`)}</span>
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="p-6 md:p-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mode}
                initial={reduceMotion ? false : { opacity: 0, x: isRegister ? 24 : -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, x: isRegister ? -24 : 24 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h1 className="text-xl font-bold text-white">
                      {t(isRegister ? 'account.registerTitle' : 'account.loginTitle')}
                    </h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-500">
                      {t(isRegister ? 'account.registerLead' : 'account.loginLead')}
                    </p>
                  </div>
                  <GuardKitten field={focused} reveal={showPassword} typed={username.length} />
                </div>

                <motion.div
                  {...rise(0.05)}
                  className="mt-4 flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3"
                >
                  <div className="min-w-0 text-xs leading-relaxed text-gray-400">
                    <div className="text-sm font-bold text-white">{t('account.notModrinthTitle')}</div>
                    <p className="mt-0.5">
                      {t(isRegister ? 'account.notModrinthRegister' : 'account.notModrinthLogin')}{' '}
                      <Link
                        href="/bmadnco"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        {t('disclaimer.what')}
                      </Link>
                    </p>
                  </div>
                </motion.div>

                {held ? (
                  <div className="mt-5 rounded-xl border border-modrinth-green/30 bg-modrinth-green/10 p-3">
                    <div className="text-sm font-bold text-white">{t('account.githubClaimTitle', { name: held.name })}</div>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-400">{t('account.githubClaimText', { provider: PROVIDER_NAMES[held.provider] || 'GitHub' })}</p>
                    <button
                      type="button"
                      onClick={createFromHeld}
                      disabled={busy || done}
                      className="mt-2 text-xs font-semibold text-modrinth-green hover:underline disabled:opacity-60"
                    >
                      {t('account.githubClaimCreate')}
                    </button>
                  </div>
                ) : github || telegram ? (
                  <>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white">{t('account.githubAuto')}</div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-gray-600 dark:text-gray-500">{t('account.githubHint')}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {telegram ? (
                          <StyledTooltip label={t('account.telegramContinue')}>
                            <button
                              type="button"
                              onClick={telegramLogin}
                              disabled={busy || done}
                              aria-label={t('account.telegramContinue')}
                              className={AUTO_BUTTON}
                            >
                              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                                <path d={TELEGRAM_ICON} />
                              </svg>
                            </button>
                          </StyledTooltip>
                        ) : null}
                        {github ? (
                          <StyledTooltip label={t('account.githubContinue')}>
                            <a href={`/api/auth/github${query}`} aria-label={t('account.githubContinue')} className={AUTO_BUTTON}>
                              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                                <path d={GITHUB_ICON} />
                              </svg>
                            </a>
                          </StyledTooltip>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-5 flex items-center gap-3 text-[11px] uppercase tracking-wide text-gray-600">
                      <span className="h-px flex-1 bg-gray-800" />
                      {t('account.or')}
                      <span className="h-px flex-1 bg-gray-800" />
                    </div>
                  </>
                ) : null}

                <form onSubmit={submit} className="mt-4 space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-gray-400">{t('account.username')}</span>
                    <span className="group relative block">
                      <FieldIcon path="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                      <input
                        type="text"
                        name="username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        onFocus={() => setFocused('username')}
                        onBlur={() => setFocused((current) => (current === 'username' ? null : current))}
                        placeholder={t('account.usernamePlaceholder')}
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        maxLength={24}
                        required
                        className={fieldInputClass}
                      />
                    </span>
                    {isRegister ? (
                      <span className="mt-1.5 block text-[11px] text-gray-600 dark:text-gray-500">{t('account.usernameHint')}</span>
                    ) : null}
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-gray-400">{t('account.password')}</span>
                    <PasswordInput
                      visible={showPassword}
                      onToggleVisible={() => setShowPassword((value) => !value)}
                      inputProps={{
                        name: 'password',
                        value: password,
                        onChange: (event) => setPassword(event.target.value),
                        onFocus: () => setFocused('password'),
                        onBlur: (event) => {
                          if (event.relatedTarget?.hasAttribute?.('data-password-toggle')) return
                          setFocused((current) => (current === 'password' ? null : current))
                        },
                        placeholder: t(isRegister ? 'account.newPasswordPlaceholder' : 'account.passwordPlaceholder'),
                        autoComplete: isRegister ? 'new-password' : 'current-password',
                        maxLength: 128,
                        required: true,
                      }}
                      toggleProps={{
                        onBlur: (event) => {
                          if (event.relatedTarget?.name !== 'password') setFocused(null)
                        },
                      }}
                    />
                    {isRegister ? <PasswordStrength password={password} /> : null}
                  </label>

                  <input
                    type="text"
                    name="website"
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
                  />

                  <AnimatePresence>
                    {error.text ? (
                      <motion.p
                        key={error.id}
                        role="alert"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto', x: reduceMotion ? 0 : [0, -8, 8, -5, 5, 0] }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35 }}
                        className="overflow-hidden rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400"
                      >
                        {error.text}
                      </motion.p>
                    ) : null}
                  </AnimatePresence>

                  <motion.button
                    type="submit"
                    disabled={busy || done || !username || !password}
                    whileHover={reduceMotion ? undefined : { scale: 1.015 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-modrinth-green px-5 py-3 text-sm font-bold text-black shadow-[0_8px_24px_-8px_rgba(var(--color-green-rgb),0.7)] transition-opacity disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                  >
                    {busy ? (
                      <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    ) : done ? (
                      <motion.svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        aria-hidden
                      >
                        <path d="m4.500 12.750 6 6 9-13.500" />
                      </motion.svg>
                    ) : null}
                    {t(isRegister ? 'account.submitRegister' : 'account.submitLogin')}
                  </motion.button>
                </form>

                {isRegister ? (
                  <p className="mt-4 text-[11px] leading-relaxed text-gray-600 dark:text-gray-500">{t('account.noRecovery')}</p>
                ) : null}

                <p className="mt-5 text-center text-sm text-gray-600 dark:text-gray-500">
                  {t(isRegister ? 'account.haveAccount' : 'account.noAccount')}{' '}
                  <Link
                    href={`/${isRegister ? 'login' : 'register'}${query}`}
                    scroll={false}
                    className="font-semibold text-modrinth-green hover:underline"
                  >
                    {t(isRegister ? 'account.login' : 'account.register')}
                  </Link>
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
