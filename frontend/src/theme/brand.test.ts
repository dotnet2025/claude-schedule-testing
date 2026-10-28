import { brand } from './brand'

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }

describe('brand palette (WCAG AA)', () => {
  const c = brand.colors
  it.each([
    ['primary on white (buttons)', '#ffffff', c.primary],
    ['body text on page background', c.background, c.textPrimary],
    ['secondary text on white', '#ffffff', c.textSecondary],
    ['secondary accent text on white', '#ffffff', c.secondaryText],
    ['white on sidebar navy', c.navy, '#ffffff'],
    ['success on white', '#ffffff', c.success],
    ['error on white', '#ffffff', c.error],
  ])('%s has contrast >= 4.5:1', (_n, bg, fg) => { expect(contrast(bg, fg)).toBeGreaterThanOrEqual(4.5) })
})
