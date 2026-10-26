'use client'

import { motion } from 'framer-motion'
import { useT } from './I18nProvider'

const STRENGTH_COLORS = ['#ef4444', '#f59e0b', '#eab308', '#22c55e']
const LOCK_PATH = 'M7 11V7a5 5 0 0 1 10 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z'

export const fieldInputClass =
  'w-full rounded-xl border border-gray-700 bg-[var(--bg-primary)] py-3 pl-10 pr-4 text-sm text-white outline-none transition-[border-color,box-shadow] placeholder:text-gray-600 focus:border-modrinth-green focus:shadow-[0_0_0_3px_rgba(var(--color-green-rgb),0.18)] dark:border-gray-800'

export function passwordStrength(password) {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[a-zа-яё]/.test(password) && /[A-ZА-ЯЁ]/.test(password)) score += 1
  if (/\d/.test(password) && /[^\dA-Za-zА-Яа-яЁё]/.test(password)) score += 1
  return Math.max(1, score)
}

export function FieldIcon({ path }) {
  return (
    <svg
      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600 dark:text-gray-500 transition-colors group-focus-within:text-modrinth-green"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path d={path} />
    </svg>
  )
}

export function PasswordStrength({ password }) {
  const t = useT()
  const strength = passwordStrength(password)
  return (
    <span className="mt-2 flex items-center gap-2">
      <span className="grid flex-1 grid-cols-4 gap-1">
        {[1, 2, 3, 4].map((level) => (
          <span key={level} className="h-1 overflow-hidden rounded-full bg-gray-800">
            <motion.span
              className="block h-full rounded-full"
              initial={false}
              animate={{
                width: strength >= level ? '100%' : '0%',
                backgroundColor: STRENGTH_COLORS[Math.max(0, strength - 1)],
              }}
              transition={{ duration: 0.25 }}
            />
          </span>
        ))}
      </span>
      <span className="shrink-0 whitespace-nowrap text-right text-[11px] text-gray-600 dark:text-gray-500">
        {strength ? t(`account.strength${strength}`) : t('account.passwordHint')}
      </span>
    </span>
  )
}

export default function PasswordInput({ visible, onToggleVisible, inputProps, toggleProps }) {
  const t = useT()
  return (
    <span className="group relative block">
      <FieldIcon path={LOCK_PATH} />
      <input type={visible ? 'text' : 'password'} {...inputProps} className={`${fieldInputClass} pr-11`} />
      <button
        type="button"
        data-password-toggle
        onClick={onToggleVisible}
        aria-label={t(visible ? 'account.hidePassword' : 'account.showPassword')}
        aria-pressed={visible}
        {...toggleProps}
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-600 dark:text-gray-500 transition-colors hover:text-white"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
          {visible ? (
            <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A9.800 9.800 0 0 1 12 5c6 0 9.500 7 9.500 7a16 16 0 0 1-3.200 3.900M6.300 6.300A16 16 0 0 0 2.500 12S6 19 12 19a9.600 9.600 0 0 0 4-.9" />
          ) : (
            <path d="M2.500 12S6 5 12 5s9.500 7 9.500 7-3.500 7-9.500 7-9.500-7-9.500-7ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          )}
        </svg>
      </button>
    </span>
  )
}
