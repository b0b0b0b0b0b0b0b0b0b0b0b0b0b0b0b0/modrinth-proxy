const DISCLOSURE_ORDER = [
  'epilepsy_triggers',
  'ai_content',
  'advertisements',
  'paid_features',
  'telemetry',
  'system_interactions',
  'derivative_work',
]

const AI_USE_KEYS = {
  code: 'disc.aiUse.code',
  assets: 'disc.aiUse.assets',
  text: 'disc.aiUse.text',
  functionality: 'disc.aiUse.functionality',
}

const TELEMETRY_KIND_KEYS = {
  opt_in: 'disc.telOptIn',
  opt_out: 'disc.telOptOut',
  always_active: 'disc.telAlways',
}

export function formatAiContentTitle(uses = [], t) {
  const items = uses.map((use) => t(AI_USE_KEYS[use] || use)).filter(Boolean)
  if (items.length === 0) return t('disc.aiBare')
  if (items.length === 1) return t('disc.aiOne', { item: items[0] })
  const last = items[items.length - 1]
  const rest = items.slice(0, -1).join(', ')
  return t('disc.aiMany', { rest, last })
}

export function formatTelemetryTitle(consent, t) {
  const kind = t(TELEMETRY_KIND_KEYS[consent] || 'disc.telUnknown')
  return t('disc.telemetryTitle', { kind })
}

export function getDisclosureTitle(disclosure, t) {
  switch (disclosure.type) {
    case 'epilepsy_triggers':
      return t('disc.epilepsy')
    case 'ai_content':
      return formatAiContentTitle(disclosure.uses, t)
    case 'advertisements':
      return t('disc.ads')
    case 'paid_features':
      return t('disc.paid')
    case 'telemetry':
      return formatTelemetryTitle(disclosure.consent, t)
    case 'system_interactions':
      return t('disc.systems')
    case 'derivative_work':
      return t('disc.derivative')
    default:
      return disclosure.type
  }
}

export function sortSidebarDisclosures(disclosures) {
  const order = new Map(DISCLOSURE_ORDER.map((type, index) => [type, index]))
  return [...disclosures]
    .filter((item) => item?.type && item.type !== 'archived')
    .sort((a, b) => {
      const aIndex = order.get(a.type) ?? 999
      const bIndex = order.get(b.type) ?? 999
      return aIndex - bIndex
    })
}

export function findArchivedDisclosure(disclosures) {
  return disclosures?.find((item) => item?.type === 'archived') ?? null
}

export function getDisclosureDetails(disclosure) {
  switch (disclosure.type) {
    case 'paid_features':
      return (disclosure.features || []).filter(Boolean)
    case 'telemetry':
      return (disclosure.data_collected || []).filter(Boolean)
    case 'derivative_work':
      return (disclosure.sources || []).filter((source) => source?.label || source?.link || source?.note)
    default:
      return disclosure.note?.trim() ? [disclosure.note] : []
  }
}
