const TELEGRAM_ORIGIN = 'https://oauth.telegram.org'
const POPUP_WIDTH = 550
const POPUP_HEIGHT = 470

export function requestTelegramAuth(botId) {
  return new Promise((resolve) => {
    const left = Math.max(0, (window.screen.width - POPUP_WIDTH) / 2)
    const top = Math.max(0, (window.screen.height - POPUP_HEIGHT) / 2)
    const params = new URLSearchParams({
      bot_id: botId,
      origin: window.location.origin,
      request_access: 'write',
      return_to: window.location.href,
    })
    const popup = window.open(
      `${TELEGRAM_ORIGIN}/auth?${params}`,
      `telegram_oauth_bot${botId}`,
      `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},status=0,location=0,menubar=0,toolbar=0`,
    )
    if (!popup) {
      resolve(null)
      return
    }

    let settled = false
    let timer = null
    const finish = (value) => {
      if (settled) return
      settled = true
      window.removeEventListener('message', onMessage)
      clearInterval(timer)
      resolve(value && typeof value === 'object' ? value : null)
    }
    const onMessage = (event) => {
      if (event.origin !== TELEGRAM_ORIGIN || event.source !== popup) return
      let data
      try {
        data = JSON.parse(event.data)
      } catch {
        return
      }
      if (data?.event === 'auth_result') finish(data.result)
    }
    window.addEventListener('message', onMessage)

    timer = setInterval(() => {
      if (!popup.closed) return
      clearInterval(timer)
      fetch(`${TELEGRAM_ORIGIN}/auth/get`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: `bot_id=${encodeURIComponent(botId)}`,
      })
        .then((response) => response.json())
        .then((data) => finish(data?.user))
        .catch(() => finish(null))
    }, 300)
  })
}

export async function signInWithTelegram(botId, next) {
  const auth = await requestTelegramAuth(botId)
  if (!auth) return { result: 'cancelled' }
  try {
    const response = await fetch('/api/auth/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth, next: next || null }),
    })
    const data = await response.json().catch(() => null)
    if (response.ok && data?.result) return data
    return { result: 'error', error: data?.error || 'telegram' }
  } catch {
    return { result: 'error', error: 'telegram' }
  }
}
