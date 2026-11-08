import { ModrinthMirror } from './modrinthMirror'
import { MODRINTH_USER_AGENT } from './modrinth'
import { relayModrinthResponse } from './modrinthRelay'

const SECOND_MS = 1000
const MINUTE_MS = 60 * SECOND_MS

export class ModrinthBudget {
  #stamps = []
  #remaining = null
  #remainingUntil = 0
  #limitedUntil = 0

  constructor({ windowMs, softLimit, softRemaining, hardRemaining, freshMs }) {
    this.windowMs = windowMs
    this.softLimit = softLimit
    this.softRemaining = softRemaining
    this.hardRemaining = hardRemaining
    this.freshMs = freshMs
  }

  noteRequest(now = Date.now()) {
    this.#stamps.push(now)
    this.#prune(now)
  }

  observe(response, now = Date.now()) {
    const headers = response.headers
    const resetMs = this.#seconds(headers.get('x-ratelimit-reset')) ?? this.#seconds(headers.get('retry-after')) ?? this.windowMs / SECOND_MS
    if (response.status === 429) {
      this.#limitedUntil = Math.max(this.#limitedUntil, now + resetMs * SECOND_MS)
      return
    }
    const remaining = Number(headers.get('x-ratelimit-remaining'))
    const sentAt = Date.parse(headers.get('date') || '')
    if (!Number.isFinite(remaining) || !Number.isFinite(sentAt) || Math.abs(now - sentAt) > this.freshMs) return
    this.#remaining = remaining
    this.#remainingUntil = now + resetMs * SECOND_MS
  }

  used(now = Date.now()) {
    this.#prune(now)
    return this.#stamps.length
  }

  remaining(now = Date.now()) {
    return now < this.#remainingUntil ? this.#remaining : null
  }

  strained(now = Date.now()) {
    const remaining = this.remaining(now)
    return this.exhausted(now) || this.used(now) >= this.softLimit || (remaining !== null && remaining <= this.softRemaining)
  }

  exhausted(now = Date.now()) {
    const remaining = this.remaining(now)
    return now < this.#limitedUntil || (remaining !== null && remaining <= this.hardRemaining)
  }

  #prune(now) {
    const edge = now - this.windowMs
    let drop = 0
    while (drop < this.#stamps.length && this.#stamps[drop] <= edge) drop += 1
    if (drop) this.#stamps.splice(0, drop)
  }

  #seconds(value) {
    const n = Number(value)
    return value != null && value !== '' && Number.isFinite(n) && n >= 0 ? n : null
  }
}

export class RouteSwitch {
  #until = 0

  constructor(holdMs) {
    this.holdMs = holdMs
  }

  engage(now = Date.now()) {
    const fresh = now >= this.#until
    this.#until = now + this.holdMs
    return fresh
  }

  active(now = Date.now()) {
    return now < this.#until
  }

  get until() {
    return this.#until
  }
}

export class ModrinthRouter {
  constructor({ budget, mirror, routeSwitch, hedgeMs, onEvent, relay = null }) {
    this.budget = budget
    this.relay = relay
    this.mirror = mirror
    this.routeSwitch = routeSwitch
    this.hedgeMs = hedgeMs
    this.onEvent = onEvent
  }

  get onMirror() {
    return this.routeSwitch.active()
  }

  async fetch(url, method, official) {
    const response = await this.#route(url, method, official)
    if (response.status !== 429 || method !== 'GET' || !this.relay) return response
    return (await this.relay(url)) ?? response
  }

  async #route(url, method, official) {
    const direct = () => this.#official(official)
    if (method !== 'GET' || !this.mirror.supports(url)) return direct()

    if (this.budget.strained()) this.#engage('budget')
    if (!this.routeSwitch.active()) {
      const response = await direct()
      if (response.status !== 429) return response
      this.#engage('limited')
      return (await this.#fromMirror(url)) ?? response
    }
    return this.#throughMirror(url, direct)
  }

  async #throughMirror(url, direct) {
    const mirrored = this.#fromMirror(url)
    if (this.budget.exhausted()) return (await mirrored) ?? this.#refusal()

    const early = await Promise.race([mirrored, this.#delay(this.hedgeMs)])
    if (early) return early
    if (early === null) return this.budget.exhausted() ? this.#refusal() : direct()
    return this.#firstUseful(mirrored, direct)
  }

  #firstUseful(mirrored, direct) {
    return new Promise((resolve) => {
      let fallback = null
      let mirrorDone = false
      let officialDone = false
      const finishWithFallback = () => resolve(fallback ?? this.#refusal())
      mirrored.then((response) => {
        mirrorDone = true
        if (response) resolve(response)
        else if (officialDone) finishWithFallback()
      })
      const started = this.budget.exhausted() ? Promise.resolve(null) : direct()
      started.then(
        (response) => {
          officialDone = true
          if (response?.ok) return resolve(response)
          fallback = response
          if (mirrorDone) finishWithFallback()
        },
        () => {
          officialDone = true
          if (mirrorDone) finishWithFallback()
        },
      )
    })
  }

  async #official(official) {
    this.budget.noteRequest()
    const response = await official()
    try {
      this.budget.observe(response)
    } catch {}
    return response
  }

  async #fromMirror(url) {
    const payload = await this.mirror.lookup(url)
    if (!payload) return null
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'content-type': 'application/json', 'x-modrinth-route': this.mirror.name },
    })
  }

  #refusal() {
    return new Response(JSON.stringify({ error: 'rate_limited', description: 'Modrinth limit is used up and the mirror did not answer' }), {
      status: 429,
      headers: { 'content-type': 'application/json', 'x-modrinth-route': 'none' },
    })
  }

  #engage(reason) {
    if (this.routeSwitch.engage()) {
      console.warn(`Modrinth is near its limit (${reason}), switching to ${this.mirror.name} mirror`)
      this.#note('switched')
    }
  }

  #note(event) {
    try {
      this.onEvent?.(event)
    } catch {}
  }

  #delay(ms) {
    return new Promise((resolve) => setTimeout(() => resolve(undefined), ms))
  }
}

export function createModrinthRouter({ onEvent } = {}) {
  return new ModrinthRouter({
    budget: new ModrinthBudget({
      windowMs: MINUTE_MS,
      softLimit: 250,
      softRemaining: 50,
      hardRemaining: 5,
      freshMs: 10 * SECOND_MS,
    }),
    mirror: new ModrinthMirror({
      name: 'MCIM',
      origin: 'https://mod.mcimirror.top',
      prefix: '/modrinth',
      enabled: process.env.MODRINTH_MIRROR !== 'off',
      userAgent: MODRINTH_USER_AGENT,
      timeoutMs: 25 * SECOND_MS,
      maxAgeMs: 2 * 24 * 60 * MINUTE_MS,
      cacheTtlMs: 15 * MINUTE_MS,
      cacheMaxBytes: 64 * 1024 * 1024,
      pauseMs: 30 * SECOND_MS,
      maxPauseMs: 10 * MINUTE_MS,
      onResult: onEvent,
    }),
    routeSwitch: new RouteSwitch(3 * MINUTE_MS),
    hedgeMs: 2 * SECOND_MS,
    onEvent,
    relay: (url) => relayModrinthResponse(url, MODRINTH_USER_AGENT),
  })
}
