const SIGNED_HINT_RE = /(?:^|;\s*)(?:mp_signed|mp_sso)=1(?:;|$)/

export function hasSignedHint() {
  return typeof document !== 'undefined' && SIGNED_HINT_RE.test(document.cookie)
}
