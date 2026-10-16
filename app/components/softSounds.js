'use client'

const STORAGE_KEY = 'kitten-sounds'
const listeners = new Set()
let context = null
let muted = null

function readMuted() {
  if (muted !== null) return muted
  try {
    muted = localStorage.getItem(STORAGE_KEY) === 'off'
  } catch {
    muted = false
  }
  return muted
}

export function soundsMuted() {
  return readMuted()
}

export function setSoundsMuted(next) {
  muted = next
  try {
    localStorage.setItem(STORAGE_KEY, next ? 'off' : 'on')
  } catch {}
  listeners.forEach((listener) => listener(next))
}

export function onSoundsMutedChange(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function audio() {
  if (readMuted() || typeof window === 'undefined') return null
  const Context = window.AudioContext || window.webkitAudioContext
  if (!Context) return null
  if (!context) context = new Context()
  if (context.state === 'suspended') context.resume().catch(() => {})
  return context
}

function tone(ctx, { type = 'sine', from, to = from, start = 0, attack = 0.006, length, volume, cutoff = 2400 }) {
  const at = ctx.currentTime + start
  const osc = ctx.createOscillator()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(from, at)
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, at + length * 0.8)
  filter.type = 'lowpass'
  filter.frequency.value = cutoff
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(volume, at + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length)
  osc.connect(filter).connect(gain).connect(ctx.destination)
  osc.start(at)
  osc.stop(at + length + 0.05)
}

const vary = (value, spread) => value * (1 + (Math.random() * 2 - 1) * spread)

export function playPop() {
  const ctx = audio()
  if (!ctx) return
  tone(ctx, { from: vary(620, 0.15), to: vary(210, 0.1), length: 0.14, volume: 0.13, cutoff: 1800 })
  tone(ctx, { from: vary(1240, 0.15), to: vary(500, 0.1), length: 0.06, volume: 0.03, cutoff: 3000 })
}

export function playChime() {
  const ctx = audio()
  if (!ctx) return
  const base = vary(1046, 0.03)
  tone(ctx, { from: base, length: 0.45, volume: 0.05, attack: 0.012 })
  tone(ctx, { from: base * 1.26, start: 0.09, length: 0.55, volume: 0.045, attack: 0.012 })
  tone(ctx, { from: base * 1.5, start: 0.18, length: 0.6, volume: 0.03, attack: 0.012 })
}

export function playBloop() {
  const ctx = audio()
  if (!ctx) return
  tone(ctx, { from: vary(200, 0.08), to: vary(340, 0.08), length: 0.2, volume: 0.07, attack: 0.012, cutoff: 1200 })
}

function curve(param, points, at) {
  param.setValueAtTime(points[0][1], at)
  for (const [time, value] of points.slice(1)) param.exponentialRampToValueAtTime(value, at + time)
}

function voice(ctx, { length, pitch, f1, f2, volume, attack = 0.05, roll = 0 }) {
  const at = ctx.currentTime
  const source = ctx.createOscillator()
  source.type = 'sawtooth'
  curve(source.frequency, pitch, at)

  const vibrato = ctx.createOscillator()
  const vibratoDepth = ctx.createGain()
  vibrato.frequency.value = 6
  vibratoDepth.gain.value = pitch[0][1] * 0.012
  vibrato.connect(vibratoDepth).connect(source.frequency)

  const mix = ctx.createGain()
  for (const [points, level, q] of [[f1, 1, 7], [f2, 0.55, 9]]) {
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.Q.value = q
    curve(band.frequency, points, at)
    const bandLevel = ctx.createGain()
    bandLevel.gain.value = level
    source.connect(band).connect(bandLevel).connect(mix)
  }

  const tremble = ctx.createGain()
  mix.connect(tremble)
  let lfo = null
  if (roll) {
    lfo = ctx.createOscillator()
    const lfoDepth = ctx.createGain()
    lfo.frequency.value = roll
    tremble.gain.value = 0.6
    lfoDepth.gain.value = 0.4
    lfo.connect(lfoDepth).connect(tremble.gain)
  }

  const envelope = ctx.createGain()
  envelope.gain.setValueAtTime(0.0001, at)
  envelope.gain.exponentialRampToValueAtTime(volume, at + attack)
  envelope.gain.setValueAtTime(volume, at + length * 0.6)
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + length)

  const soften = ctx.createBiquadFilter()
  soften.type = 'lowpass'
  soften.frequency.value = 3000

  tremble.connect(envelope).connect(soften).connect(ctx.destination)
  for (const node of [source, vibrato, lfo]) {
    if (!node) continue
    node.start(at)
    node.stop(at + length + 0.05)
  }
}

export function playMew() {
  const ctx = audio()
  if (!ctx) return
  const p = vary(1, 0.06)
  voice(ctx, {
    length: 0.62,
    volume: 0.12,
    attack: 0.07,
    pitch: [[0, 620 * p], [0.12, 880 * p], [0.34, 820 * p], [0.62, 540 * p]],
    f1: [[0, 380], [0.12, 950], [0.4, 700], [0.62, 420]],
    f2: [[0, 1300], [0.12, 1800], [0.4, 1250], [0.62, 850]],
  })
}

export function playTrill() {
  const ctx = audio()
  if (!ctx) return
  const p = vary(1, 0.05)
  voice(ctx, {
    length: 0.36,
    volume: 0.15,
    attack: 0.04,
    roll: 26,
    pitch: [[0, 470 * p], [0.16, 600 * p], [0.36, 720 * p]],
    f1: [[0, 420], [0.18, 650], [0.36, 780]],
    f2: [[0, 1200], [0.18, 1450], [0.36, 1700]],
  })
}
