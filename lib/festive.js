export const FESTIVE_EVENT = 'festiveChange'

export function festiveOff() {
  if (typeof document === 'undefined') return false
  return document.cookie.split('; ').includes('mp_festive_off=1')
}

export function announceFestiveChange() {
  window.dispatchEvent(new Event(FESTIVE_EVENT))
}

export function onFestiveChange(listener) {
  const handle = () => listener(festiveOff())
  window.addEventListener(FESTIVE_EVENT, handle)
  return () => window.removeEventListener(FESTIVE_EVENT, handle)
}
