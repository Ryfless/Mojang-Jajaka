import type { ThemePreferences } from '@/types/moka'

export interface ThemePreset {
  id: string
  name: string
  description: string
  brand: string
  cocoa: string
  canvas: string
  paper: string
  accent: string
}

export const DEFAULT_THEME: ThemePreferences = {
  presetId: 'burgundy-sunda',
  brand: '#810b38',
  cocoa: '#541a1a',
  canvas: '#f1e2d1',
  paper: '#fbf6f0',
  accent: '#dcc3aa',
  logoUrl: '/images/logo-moka.png',
  coverUrl: '/images/Cover.png',
  eventYear: '2026',
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'burgundy-sunda',
    name: 'Burgundy Sunda (Bawaan)',
    description: 'Palet seremonial merah marun, krem hangat, dan cokelat cocoa.',
    brand: '#810b38',
    cocoa: '#541a1a',
    canvas: '#f1e2d1',
    paper: '#fbf6f0',
    accent: '#dcc3aa',
  },
  {
    id: 'zamrud-bogor',
    name: 'Zamrud Pajajaran',
    description: 'Nuansa hijau rimbun Kebun Raya dengan latar gading lembut.',
    brand: '#1b5e43',
    cocoa: '#173329',
    canvas: '#eaece4',
    paper: '#f8faf6',
    accent: '#c5d1bf',
  },
  {
    id: 'biru-keraton',
    name: 'Nila Pakuan',
    description: 'Biru indigo elegan berpadu krem keperakan yang tenang.',
    brand: '#1f4b78',
    cocoa: '#19293e',
    canvas: '#e8edf2',
    paper: '#f7f9fc',
    accent: '#c3cfdd',
  },
  {
    id: 'soga-klasik',
    name: 'Soga Batik Klasik',
    description: 'Cokelat soga hangat dan emas kuno bernuansa tradisional.',
    brand: '#8f4719',
    cocoa: '#3d2417',
    canvas: '#f2e8dc',
    paper: '#fcf8f3',
    accent: '#dcc3a5',
  },
]

function normalizeHex(value: string | undefined | null, fallback: string): string {
  if (!value) return fallback
  const trimmed = value.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase()
  return fallback
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const num = Number.parseInt(clean, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

export function mixHex(hexA: string, hexB: string, ratio: number): string {
  const [r1, g1, b1] = hexToRgb(normalizeHex(hexA, '#810b38'))
  const [r2, g2, b2] = hexToRgb(normalizeHex(hexB, '#000000'))
  const t = Math.max(0, Math.min(1, ratio))
  const r = Math.round(r1 * (1 - t) + r2 * t)
  const g = Math.round(g1 * (1 - t) + g2 * t)
  const b = Math.round(b1 * (1 - t) + b2 * t)
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

function sanitizeImageUrl(url: string | undefined | null, fallback: string): string {
  if (!url) return fallback
  const trimmed = url.trim()
  if (/^(?:\/(?!\/)|data:image\/)/.test(trimmed)) return trimmed
  return fallback
}

function toCssUrl(url: string): string {
  return `url("${url.replace(/"/g, '\\"')}")`
}

export function resolveTheme(partial?: Partial<ThemePreferences> | null): ThemePreferences {
  return {
    presetId: partial?.presetId || DEFAULT_THEME.presetId,
    brand: normalizeHex(partial?.brand, DEFAULT_THEME.brand),
    cocoa: normalizeHex(partial?.cocoa, DEFAULT_THEME.cocoa),
    canvas: normalizeHex(partial?.canvas, DEFAULT_THEME.canvas),
    paper: normalizeHex(partial?.paper, DEFAULT_THEME.paper),
    accent: normalizeHex(partial?.accent, DEFAULT_THEME.accent),
    logoUrl: sanitizeImageUrl(partial?.logoUrl, DEFAULT_THEME.logoUrl),
    coverUrl: sanitizeImageUrl(partial?.coverUrl, DEFAULT_THEME.coverUrl),
    eventYear: (partial?.eventYear || DEFAULT_THEME.eventYear).trim().slice(0, 16) || '2026',
  }
}

export function applyThemeToDocument(partial?: Partial<ThemePreferences> | null): void {
  if (typeof document === 'undefined') return
  const theme = resolveTheme(partial)
  const root = document.documentElement

  root.style.setProperty('--color-brand', theme.brand)
  root.style.setProperty('--color-brand-dark', mixHex(theme.brand, '#000000', 0.22))
  root.style.setProperty('--color-brick', mixHex(theme.brand, '#ffffff', 0.16))
  root.style.setProperty('--color-cocoa', theme.cocoa)
  root.style.setProperty('--color-umber', mixHex(theme.cocoa, theme.brand, 0.35))
  root.style.setProperty('--color-ink', theme.cocoa)
  root.style.setProperty('--color-muted', mixHex(theme.cocoa, '#ffffff', 0.32))
  root.style.setProperty('--color-canvas', theme.canvas)
  root.style.setProperty('--color-ivory', theme.canvas)
  root.style.setProperty('--color-paper', theme.paper)
  root.style.setProperty('--color-gold', theme.accent)
  root.style.setProperty('--color-champagne', theme.accent)
  root.style.setProperty('--color-line', theme.accent)
  root.style.setProperty('--color-gold-light', mixHex(theme.accent, '#ffffff', 0.32))
  root.style.setProperty('--color-gold-dark', mixHex(theme.accent, theme.cocoa, 0.55))

  root.style.setProperty('--moka-logo-url', toCssUrl(theme.logoUrl))
  root.style.setProperty('--moka-cover-url', toCssUrl(theme.coverUrl))

  const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (favicon && favicon.getAttribute('href') !== theme.logoUrl) {
    favicon.setAttribute('href', theme.logoUrl)
  }
}
