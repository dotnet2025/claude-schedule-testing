import { formatBytes, slugify } from './format'
describe('format utils', () => {
  it('formats bytes', () => { expect(formatBytes(512)).toBe('512 B'); expect(formatBytes(2048)).toBe('2.0 KB'); expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB') })
  it('slugifies text with accents, symbols and edge cases', () => {
    expect(slugify('Café Münster!!')).toBe('cafe-munster'); expect(slugify('  --a  b-- ')).toBe('a-b'); expect(slugify('🎉')).toBe('')
  })
})
