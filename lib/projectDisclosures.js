const DISCLOSURE_ORDER = [
  'epilepsy_triggers',
  'ai_content',
  'advertisements',
  'paid_features',
  'telemetry',
  'system_interactions',
  'derivative_work',
]

const AI_USE_LABELS = {
  code: 'код',
  assets: 'ресурсы',
  text: 'текст',
  functionality: 'функциональность',
}

const TELEMETRY_CONSENT_LABELS = {
  opt_in: 'с согласия пользователя',
  opt_out: 'с возможностью отказа',
  always_active: 'всегда активная',
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

export function formatAiContentTitle(uses = []) {
  const items = uses.map((use) => AI_USE_LABELS[use] || use).filter(Boolean)
  if (items.length === 0) return 'Содержит AI-сгенерированный контент'
  if (items.length === 1) return `Содержит AI-сгенерированный ${items[0]}`
  const last = items[items.length - 1]
  const rest = items.slice(0, -1).join(', ')
  return `Содержит AI-сгенерированный ${rest} и ${last}`
}

export function formatTelemetryTitle(consent) {
  const label = TELEMETRY_CONSENT_LABELS[consent] || consent || 'неизвестная'
  return `Содержит ${label} телеметрию`
}

export function getDisclosureTitle(disclosure) {
  switch (disclosure.type) {
    case 'epilepsy_triggers':
      return 'Предупреждение о светочувствительности'
    case 'ai_content':
      return formatAiContentTitle(disclosure.uses)
    case 'advertisements':
      return 'Содержит рекламу'
    case 'paid_features':
      return 'Содержит платные функции'
    case 'telemetry':
      return formatTelemetryTitle(disclosure.consent)
    case 'system_interactions':
      return 'Взаимодействует с внешними системами'
    case 'derivative_work':
      return 'Производная работа на основе:'
    default:
      return disclosure.type
  }
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
