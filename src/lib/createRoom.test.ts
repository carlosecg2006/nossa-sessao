import { describe, expect, it } from 'vitest'
import { roomLinks } from './createRoom'

describe('roomLinks', () => {
  it('builds friend and owner links from the site base', () => {
    const l = roomLinks('https://carlosecg2006.github.io/nossa-sessao/', 'A'.repeat(20), 'B'.repeat(20))
    expect(l.friend).toBe(`https://carlosecg2006.github.io/nossa-sessao/?sala=${'A'.repeat(20)}`)
    expect(l.owner).toBe(`https://carlosecg2006.github.io/nossa-sessao/?sala=${'A'.repeat(20)}&dono=${'B'.repeat(20)}`)
  })
})
